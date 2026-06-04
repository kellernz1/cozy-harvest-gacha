import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react';
import {
  type Seed, type Rarity, type SeedType, type SkillId,
  RARITY_INCOME, SEED_TYPES, PACKS, PLOT_COSTS,
  TOTAL_PLOTS, INCOME_INTERVAL, MAX_OFFLINE_TICKS, STORAGE_KEY, RARITIES,
  SKILLS, xpForLevel, XP_REWARDS, FERTILIZER_DURATION, WATERING_DURATION,
  REFORGE_RATES, getNextRarity,
  type DailyGoalId, type AchievementId,
} from './constants';
import { SFX } from './sounds';
import { toast } from 'sonner';

// === STATE ===

export interface PlotState {
  unlocked: boolean;
  seed: Seed | null;
  fertilizedUntil: number | null; // timestamp
  wateredUntil: number | null; // timestamp
}

export type SkillLevels = Record<SkillId, number>; // 0 = not unlocked, 1-3 = tier

export interface GameState {
  money: number;
  inventory: Seed[];
  plots: PlotState[];
  lastTick: number;
  level: number;
  xp: number;
  skillPoints: number;
  skills: SkillLevels;
  fertilizers: number; // owned fertilizer items
  muted: boolean;
  stats: GameStats;
  daily: DailyStats;
  claimedDailyGoals: DailyGoalId[];
  claimedAchievements: AchievementId[];
}

export interface GameStats {
  incomeEarned: number;
  packsOpened: number;
  seedsPlanted: number;
  seedsSold: number;
  reforges: number;
  plotsUnlocked: number;
  legendaryFound: boolean;
}

export interface DailyStats {
  date: string;
  incomeEarned: number;
  packsOpened: number;
  seedsPlanted: number;
  reforges: number;
}

const defaultState = (): GameState => ({
  money: 50,
  inventory: [],
  plots: Array.from({ length: TOTAL_PLOTS }, (_, i) => ({
    unlocked: i === 0,
    seed: null,
    fertilizedUntil: null,
    wateredUntil: null,
  })),
  lastTick: Date.now(),
  level: 1,
  xp: 0,
  skillPoints: 0,
  skills: { packDiscount: 0, yieldBoost: 0, speedBoost: 0, autoWater: 0 },
  fertilizers: 0,
  muted: false,
  stats: {
    incomeEarned: 0,
    packsOpened: 0,
    seedsPlanted: 0,
    seedsSold: 0,
    reforges: 0,
    plotsUnlocked: 1,
    legendaryFound: false,
  },
  daily: {
    date: todayKey(),
    incomeEarned: 0,
    packsOpened: 0,
    seedsPlanted: 0,
    reforges: 0,
  },
  claimedDailyGoals: [],
  claimedAchievements: [],
});

// === ACTIONS ===

type Action =
  | { type: 'OPEN_PACK'; packId: number }
  | { type: 'ADD_SEEDS'; seeds: Seed[] }
  | { type: 'PLANT_SEED'; seedId: string; plotIndex: number }
  | { type: 'REMOVE_SEED'; plotIndex: number }
  | { type: 'SELL_SEED'; seedId: string }
  | { type: 'UNLOCK_PLOT'; plotIndex: number }
  | { type: 'TICK_INCOME'; amount: number }
  | { type: 'RESET_GAME' }
  | { type: 'SET_STATE'; state: GameState }
  | { type: 'ADD_XP'; amount: number }
  | { type: 'UNLOCK_SKILL'; skillId: SkillId }
  | { type: 'BUY_FERTILIZER' }
  | { type: 'APPLY_FERTILIZER'; plotIndex: number }
  | { type: 'WATER_PLOT'; plotIndex: number }
  | { type: 'REFORGE'; seedIds: string[]; success?: boolean }
  | { type: 'CLAIM_DAILY_GOAL'; goalId: DailyGoalId; reward: number }
  | { type: 'CLAIM_ACHIEVEMENT'; achievementId: AchievementId; reward: number }
  | { type: 'TOGGLE_MUTE' };

let idCounter = Date.now();
const genId = () => `seed_${idCounter++}`;

// === GACHA ENGINE ===

function rollRarity(rates: Partial<Record<Rarity, number>>): Rarity {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITIES) {
    const rate = rates[rarity];
    if (rate) {
      cumulative += rate;
      if (rand < cumulative) return rarity;
    }
  }
  return 'Common';
}

export function rollPack(packId: number): Seed[] {
  const pack = PACKS.find(p => p.id === packId);
  if (!pack) return [];
  const seeds: Seed[] = [];
  for (let i = 0; i < pack.seedCount; i++) {
    const rarity = rollRarity(pack.rates);
    const type = SEED_TYPES[Math.floor(Math.random() * SEED_TYPES.length)];
    seeds.push({ id: genId(), type, rarity });
  }
  return seeds;
}

// === SKILL HELPERS ===

export function getPackDiscount(skills: SkillLevels): number {
  const tier = skills.packDiscount;
  if (tier === 0) return 0;
  return SKILLS.find(s => s.id === 'packDiscount')!.tiers[tier - 1].effect;
}

export function getYieldMultiplier(skills: SkillLevels): number {
  const tier = skills.yieldBoost;
  if (tier === 0) return 1;
  return 1 + SKILLS.find(s => s.id === 'yieldBoost')!.tiers[tier - 1].effect / 100;
}

export function getBaseInterval(skills: SkillLevels): number {
  const tier = skills.speedBoost;
  if (tier === 0) return INCOME_INTERVAL;
  return SKILLS.find(s => s.id === 'speedBoost')!.tiers[tier - 1].effect;
}

export function getAutoWaterInterval(skills: SkillLevels): number | null {
  const tier = skills.autoWater;
  if (tier === 0) return null;
  return SKILLS.find(s => s.id === 'autoWater')!.tiers[tier - 1].effect;
}

export function getDiscountedCost(baseCost: number, skills: SkillLevels): number {
  const discount = getPackDiscount(skills);
  return Math.floor(baseCost * (1 - discount / 100));
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getMarketBonus(date = new Date()): { seedType: SeedType; multiplier: number } {
  const day = Math.floor(date.getTime() / 86_400_000);
  return {
    seedType: SEED_TYPES[day % SEED_TYPES.length],
    multiplier: 1.5,
  };
}

function normalizeDaily(state: GameState): GameState {
  const date = todayKey();
  if (state.daily.date === date) return state;
  return {
    ...state,
    daily: { date, incomeEarned: 0, packsOpened: 0, seedsPlanted: 0, reforges: 0 },
    claimedDailyGoals: [],
  };
}

// === XP HELPERS ===

function addXpToState(state: GameState, amount: number): GameState {
  let xp = state.xp + amount;
  let level = state.level;
  let skillPoints = state.skillPoints;
  let leveledUp = false;

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    skillPoints++;
    leveledUp = true;
  }

  if (leveledUp) {
    setTimeout(() => {
      SFX.levelUp();
      toast(`🎉 Level Up! You're now level ${level}!`);
    }, 0);
  }

  return { ...state, xp, level, skillPoints };
}

// === REDUCER ===

function gameReducer(state: GameState, action: Action): GameState {
  state = normalizeDaily(state);

  switch (action.type) {
    case 'ADD_SEEDS':
      return { ...state, inventory: [...state.inventory, ...action.seeds] };

    case 'OPEN_PACK': {
      const pack = PACKS.find(p => p.id === action.packId);
      if (!pack || state.level < pack.minLevel) return state;
      const cost = getDiscountedCost(pack.cost, state.skills);
      if (state.money < cost) return state;
      const s = {
        ...state,
        money: state.money - cost,
        stats: { ...state.stats, packsOpened: state.stats.packsOpened + 1 },
        daily: { ...state.daily, packsOpened: state.daily.packsOpened + 1 },
      };
      return addXpToState(s, XP_REWARDS.packOpen);
    }

    case 'PLANT_SEED': {
      const seedIdx = state.inventory.findIndex(s => s.id === action.seedId);
      if (seedIdx === -1) return state;
      const plot = state.plots[action.plotIndex];
      if (!plot || !plot.unlocked || plot.seed) return state;
      const newInventory = [...state.inventory];
      const [seed] = newInventory.splice(seedIdx, 1);
      const newPlots = [...state.plots];
      newPlots[action.plotIndex] = { ...plot, seed };
      return {
        ...state,
        inventory: newInventory,
        plots: newPlots,
        stats: {
          ...state.stats,
          seedsPlanted: state.stats.seedsPlanted + 1,
          legendaryFound: state.stats.legendaryFound || seed.rarity === 'Legendary',
        },
        daily: { ...state.daily, seedsPlanted: state.daily.seedsPlanted + 1 },
      };
    }

    case 'REMOVE_SEED': {
      const plot = state.plots[action.plotIndex];
      if (!plot || !plot.seed) return state;
      const refund = Math.floor(RARITY_INCOME[plot.seed.rarity] * 0.1);
      const newPlots = [...state.plots];
      newPlots[action.plotIndex] = { ...plot, seed: null };
      return { ...state, plots: newPlots, money: state.money + refund };
    }

    case 'SELL_SEED': {
      const seedIdx = state.inventory.findIndex(s => s.id === action.seedId);
      if (seedIdx === -1) return state;
      const seed = state.inventory[seedIdx];
      const value = getSeedValue(seed);
      const newInventory = [...state.inventory];
      newInventory.splice(seedIdx, 1);
      return {
        ...state,
        inventory: newInventory,
        money: state.money + value,
        stats: { ...state.stats, seedsSold: state.stats.seedsSold + 1 },
      };
    }

    case 'UNLOCK_PLOT': {
      const cost = PLOT_COSTS[action.plotIndex];
      if (state.money < cost) return state;
      const plot = state.plots[action.plotIndex];
      if (!plot || plot.unlocked) return state;
      const newPlots = [...state.plots];
      newPlots[action.plotIndex] = { ...plot, unlocked: true };
      return {
        ...state,
        plots: newPlots,
        money: state.money - cost,
        stats: { ...state.stats, plotsUnlocked: state.stats.plotsUnlocked + 1 },
      };
    }

    case 'TICK_INCOME': {
      const s = {
        ...state,
        money: state.money + action.amount,
        lastTick: Date.now(),
        stats: { ...state.stats, incomeEarned: state.stats.incomeEarned + action.amount },
        daily: { ...state.daily, incomeEarned: state.daily.incomeEarned + action.amount },
      };
      return addXpToState(s, XP_REWARDS.incomeTick);
    }

    case 'ADD_XP':
      return addXpToState(state, action.amount);

    case 'UNLOCK_SKILL': {
      const skill = SKILLS.find(s => s.id === action.skillId);
      if (!skill) return state;
      const currentTier = state.skills[action.skillId];
      if (currentTier >= skill.tiers.length) return state;
      const nextTier = skill.tiers[currentTier];
      if (state.skillPoints < nextTier.cost) return state;
      return {
        ...state,
        skillPoints: state.skillPoints - nextTier.cost,
        skills: { ...state.skills, [action.skillId]: currentTier + 1 },
      };
    }

    case 'BUY_FERTILIZER': {
      const cost = 50;
      if (state.money < cost) return state;
      return { ...state, money: state.money - cost, fertilizers: state.fertilizers + 1 };
    }

    case 'APPLY_FERTILIZER': {
      if (state.fertilizers <= 0) return state;
      const plot = state.plots[action.plotIndex];
      if (!plot || !plot.unlocked || !plot.seed) return state;
      const now = Date.now();
      const currentEnd = plot.fertilizedUntil && plot.fertilizedUntil > now ? plot.fertilizedUntil : now;
      const newPlots = [...state.plots];
      newPlots[action.plotIndex] = { ...plot, fertilizedUntil: currentEnd + FERTILIZER_DURATION };
      return { ...state, plots: newPlots, fertilizers: state.fertilizers - 1 };
    }

    case 'WATER_PLOT': {
      const plot = state.plots[action.plotIndex];
      if (!plot || !plot.unlocked || !plot.seed) return state;
      const now = Date.now();
      const newPlots = [...state.plots];
      newPlots[action.plotIndex] = { ...plot, wateredUntil: now + WATERING_DURATION };
      return { ...state, plots: newPlots };
    }

    case 'REFORGE': {
      if (action.seedIds.length !== 3) return state;
      const seeds = action.seedIds.map(id => state.inventory.find(s => s.id === id)).filter(Boolean) as Seed[];
      if (seeds.length !== 3) return state;
      // All same type
      if (new Set(seeds.map(s => s.type)).size !== 1) return state;
      // All same rarity
      if (new Set(seeds.map(s => s.rarity)).size !== 1) return state;
      const rarity = seeds[0].rarity;
      const seedType = seeds[0].type;
      const nextRarity = getNextRarity(rarity);
      if (!nextRarity) return state;

      // Remove 3 seeds
      const newInventory = [...state.inventory];
      for (const id of action.seedIds) {
        const idx = newInventory.findIndex(s => s.id === id);
        if (idx !== -1) newInventory.splice(idx, 1);
      }

      // Roll for success
      const rate = REFORGE_RATES[rarity] || 0;
      const success = action.success ?? Math.random() * 100 < rate;

      let s = {
        ...state,
        inventory: newInventory,
        stats: { ...state.stats, reforges: state.stats.reforges + 1 },
        daily: { ...state.daily, reforges: state.daily.reforges + 1 },
      };
      s = addXpToState(s, XP_REWARDS.reforge);

      if (success) {
        const newSeed: Seed = { id: genId(), type: seedType, rarity: nextRarity };
        s.inventory = [...s.inventory, newSeed];
        s.stats = { ...s.stats, legendaryFound: s.stats.legendaryFound || nextRarity === 'Legendary' };
      }

      return s;
    }

    case 'CLAIM_DAILY_GOAL': {
      if (state.claimedDailyGoals.includes(action.goalId)) return state;
      const s = {
        ...state,
        money: state.money + action.reward,
        claimedDailyGoals: [...state.claimedDailyGoals, action.goalId],
      };
      return addXpToState(s, XP_REWARDS.dailyGoal);
    }

    case 'CLAIM_ACHIEVEMENT': {
      if (state.claimedAchievements.includes(action.achievementId)) return state;
      const s = {
        ...state,
        money: state.money + action.reward,
        claimedAchievements: [...state.claimedAchievements, action.achievementId],
      };
      return addXpToState(s, XP_REWARDS.achievement);
    }

    case 'TOGGLE_MUTE':
      return { ...state, muted: !state.muted };

    case 'RESET_GAME':
      return defaultState();

    case 'SET_STATE':
      return action.state;

    default:
      return state;
  }
}

// === CONTEXT ===

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  totalIncome: number;
  floatingIncomes: Map<number, number>;
  currentInterval: number;
  marketBonus: { seedType: SeedType; multiplier: number };
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// === PROVIDER ===

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = defaultState();
      return normalizeDaily({
        ...def,
        ...parsed,
        skills: { ...def.skills, ...parsed.skills },
        stats: { ...def.stats, ...parsed.stats },
        daily: { ...def.daily, ...parsed.daily },
        claimedDailyGoals: parsed.claimedDailyGoals ?? [],
        claimedAchievements: parsed.claimedAchievements ?? [],
      });
    }
  } catch { /* ignore */ }
  return defaultState();
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, loadState);
  const [floatingIncomes, setFloatingIncomes] = useState<Map<number, number>>(new Map());
  const currentInterval = getBaseInterval(state.skills);
  const marketBonus = getMarketBonus();

  // Save on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Offline earnings on mount
  useEffect(() => {
    const saved = loadState();
    const now = Date.now();
    const elapsed = now - saved.lastTick;
    const interval = getBaseInterval(saved.skills);
    const ticksMissed = Math.min(Math.floor(elapsed / interval), MAX_OFFLINE_TICKS);

    if (ticksMissed > 0) {
      const income = calcTotalIncome(saved, now);
      const total = ticksMissed * income;
      if (total > 0) {
        dispatch({ type: 'TICK_INCOME', amount: total });
        toast(`Welcome back! You earned $${total} while away! 🌾`);
      }
    }
  }, []);

  // Auto-water
  useEffect(() => {
    const autoInterval = getAutoWaterInterval(state.skills);
    if (!autoInterval) return;
    const timer = setInterval(() => {
      state.plots.forEach((plot, i) => {
        if (plot.unlocked && plot.seed) {
          const now = Date.now();
          if (!plot.wateredUntil || plot.wateredUntil <= now) {
            dispatch({ type: 'WATER_PLOT', plotIndex: i });
          }
        }
      });
    }, autoInterval);
    return () => clearInterval(timer);
  }, [state.skills, state.skills.autoWater, state.plots]);

  // Passive income interval
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const income = calcTotalIncome(state, now);
      if (income > 0) {
        dispatch({ type: 'TICK_INCOME', amount: income });
        SFX.coinTick();
        const newFloating = new Map<number, number>();
        state.plots.forEach((plot, i) => {
          if (plot.seed) {
            newFloating.set(i, getPlotIncome(plot, state.skills, now));
          }
        });
        setFloatingIncomes(new Map(newFloating));
        setTimeout(() => setFloatingIncomes(new Map()), 1500);
      }
    }, currentInterval);
    return () => clearInterval(interval);
  }, [state, state.plots, state.skills, currentInterval]);

  const totalIncome = calcTotalIncome(state, Date.now());

  return (
    <GameContext.Provider value={{ state, dispatch, totalIncome, floatingIncomes, currentInterval, marketBonus }}>
      {children}
    </GameContext.Provider>
  );
}

export function getSeedValue(seed: Seed, now = new Date()): number {
  const market = getMarketBonus(now);
  const base = RARITY_INCOME[seed.rarity];
  return seed.type === market.seedType ? Math.floor(base * market.multiplier) : base;
}

function getPlotIncome(plot: PlotState, skills: SkillLevels, now: number): number {
  if (!plot.seed) return 0;
  let income = RARITY_INCOME[plot.seed.rarity];
  const market = getMarketBonus(new Date(now));
  if (plot.seed.type === market.seedType) income = Math.floor(income * market.multiplier);
  income = Math.floor(income * getYieldMultiplier(skills));
  // Watering 2x
  if (plot.wateredUntil && plot.wateredUntil > now) income *= 2;
  // Fertilizer 2x
  if (plot.fertilizedUntil && plot.fertilizedUntil > now) income *= 2;
  return income;
}

function calcTotalIncome(state: GameState, now: number): number {
  return state.plots.reduce((sum, plot) => sum + getPlotIncome(plot, state.skills, now), 0);
}
