import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  type Seed, type Rarity, type SeedType,
  RARITY_INCOME, SEED_TYPES, PACKS, PLOT_COSTS,
  TOTAL_PLOTS, INCOME_INTERVAL, MAX_OFFLINE_TICKS, STORAGE_KEY, RARITIES,
} from './constants';
import { toast } from 'sonner';

// === STATE ===

export interface PlotState {
  unlocked: boolean;
  seed: Seed | null;
}

export interface GameState {
  money: number;
  inventory: Seed[];
  plots: PlotState[];
  lastTick: number;
}

const defaultState = (): GameState => ({
  money: 50,
  inventory: [],
  plots: Array.from({ length: TOTAL_PLOTS }, (_, i) => ({
    unlocked: i === 0,
    seed: null,
  })),
  lastTick: Date.now(),
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
  | { type: 'SET_STATE'; state: GameState };

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

// === REDUCER ===

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'ADD_SEEDS':
      return { ...state, inventory: [...state.inventory, ...action.seeds] };

    case 'OPEN_PACK': {
      const pack = PACKS.find(p => p.id === action.packId);
      if (!pack || state.money < pack.cost) return state;
      return { ...state, money: state.money - pack.cost };
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
      return { ...state, inventory: newInventory, plots: newPlots };
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
      const value = RARITY_INCOME[seed.rarity];
      const newInventory = [...state.inventory];
      newInventory.splice(seedIdx, 1);
      return { ...state, inventory: newInventory, money: state.money + value };
    }

    case 'UNLOCK_PLOT': {
      const cost = PLOT_COSTS[action.plotIndex];
      if (state.money < cost) return state;
      const plot = state.plots[action.plotIndex];
      if (!plot || plot.unlocked) return state;
      const newPlots = [...state.plots];
      newPlots[action.plotIndex] = { ...plot, unlocked: true };
      return { ...state, plots: newPlots, money: state.money - cost };
    }

    case 'TICK_INCOME':
      return { ...state, money: state.money + action.amount, lastTick: Date.now() };

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
      return { ...defaultState(), ...parsed };
    }
  } catch { /* ignore */ }
  return defaultState();
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, loadState);
  const floatingIncomesRef = useRef<Map<number, number>>(new Map());
  const [floatingIncomes, setFloatingIncomes] = useState<Map<number, number>>(new Map());

  // Save on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Offline earnings on mount
  useEffect(() => {
    const saved = loadState();
    const now = Date.now();
    const elapsed = now - saved.lastTick;
    const ticksMissed = Math.min(Math.floor(elapsed / INCOME_INTERVAL), MAX_OFFLINE_TICKS);

    if (ticksMissed > 0) {
      const income = calcTotalIncome(saved);
      const total = ticksMissed * income;
      if (total > 0) {
        dispatch({ type: 'TICK_INCOME', amount: total });
        toast(`Welcome back! You earned $${total} while away! 🌾`);
      }
    }
  }, []);

  // Passive income interval
  useEffect(() => {
    const interval = setInterval(() => {
      const income = calcTotalIncome(state);
      if (income > 0) {
        dispatch({ type: 'TICK_INCOME', amount: income });
        // Set floating incomes for each planted plot
        const newFloating = new Map<number, number>();
        state.plots.forEach((plot, i) => {
          if (plot.seed) {
            newFloating.set(i, RARITY_INCOME[plot.seed.rarity]);
          }
        });
        setFloatingIncomes(new Map(newFloating));
        // Clear after animation
        setTimeout(() => setFloatingIncomes(new Map()), 1500);
      }
    }, INCOME_INTERVAL);
    return () => clearInterval(interval);
  }, [state.plots]);

  const totalIncome = calcTotalIncome(state);

  return (
    <GameContext.Provider value={{ state, dispatch, totalIncome, floatingIncomes }}>
      {children}
    </GameContext.Provider>
  );
}

function calcTotalIncome(state: GameState): number {
  return state.plots.reduce((sum, plot) => {
    if (plot.seed) return sum + RARITY_INCOME[plot.seed.rarity];
    return sum;
  }, 0);
}

import { useState } from 'react';
