// === CONSTANTS ===

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export const RARITY_INCOME: Record<Rarity, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 4,
  Epic: 8,
  Legendary: 16,
};

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: 'rarity-common',
  Uncommon: 'rarity-uncommon',
  Rare: 'rarity-rare',
  Epic: 'rarity-epic',
  Legendary: 'rarity-legendary',
};

export type SeedType = 'Apple' | 'Orange' | 'Banana' | 'Strawberry' | 'Pineapple' | 'Blueberry' | 'Peach';

export const SEED_EMOJIS: Record<SeedType, string> = {
  Apple: '🍎',
  Orange: '🍊',
  Banana: '🍌',
  Strawberry: '🍓',
  Pineapple: '🍍',
  Blueberry: '🫐',
  Peach: '🍑',
};

export const SEED_TYPES: SeedType[] = ['Apple', 'Orange', 'Banana', 'Strawberry', 'Pineapple', 'Blueberry', 'Peach'];

export interface Seed {
  id: string;
  type: SeedType;
  rarity: Rarity;
}

export interface Pack {
  id: number;
  name: string;
  cost: number;
  seedCount: number;
  rates: Partial<Record<Rarity, number>>;
  minLevel: number;
}

export const PACKS: Pack[] = [
  { id: 1, name: 'Basic Pack', cost: 10, seedCount: 1, rates: { Common: 60, Uncommon: 30, Rare: 10 }, minLevel: 1 },
  { id: 2, name: 'Premium Pack', cost: 150, seedCount: 1, rates: { Common: 45, Uncommon: 30, Rare: 18, Epic: 7 }, minLevel: 5 },
  { id: 3, name: 'Legendary Pack', cost: 2000, seedCount: 1, rates: { Uncommon: 40, Rare: 35, Epic: 18, Legendary: 7 }, minLevel: 15 },
  { id: 4, name: 'Orchard Crate', cost: 650, seedCount: 3, rates: { Common: 35, Uncommon: 35, Rare: 22, Epic: 7, Legendary: 1 }, minLevel: 8 },
];

export const PLOT_COSTS = [0, 10, 20, 40, 80, 160, 320, 640, 1280];

export const PLOT_LEVEL_REQUIREMENTS = [1, 2, 2, 5, 5, 10, 10, 20, 20];

export const TOTAL_PLOTS = 9;

export const INCOME_INTERVAL = 10000; // 10 seconds
export const MAX_OFFLINE_TICKS = 360; // 1 hour = 360 * 10s

export const STORAGE_KEY = 'farmGachaRPG_save';

// === REFORGE ===
export const REFORGE_RATES: Partial<Record<Rarity, number>> = {
  Common: 80,
  Uncommon: 60,
  Rare: 50,
  Epic: 35,
};

export function getNextRarity(rarity: Rarity): Rarity | null {
  const idx = RARITIES.indexOf(rarity);
  if (idx === -1 || idx >= RARITIES.length - 1) return null;
  return RARITIES[idx + 1];
}

// === FERTILIZER ===
export const FERTILIZER_COST = 50;
export const FERTILIZER_DURATION = 10 * 60 * 1000; // 10 minutes in ms

// === WATERING ===
export const WATERING_DURATION = 5 * 60 * 1000; // 5 minutes in ms

// === XP / LEVELING ===
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.4));
}

export const XP_REWARDS = {
  incomeTick: 5,
  packOpen: 15,
  reforge: 25,
  dailyGoal: 50,
  achievement: 100,
};

export type DailyGoalId = 'dailyPacks' | 'dailyPlanting' | 'dailyIncome' | 'dailyReforge';

export interface DailyGoalDef {
  id: DailyGoalId;
  label: string;
  description: string;
  target: number;
  reward: number;
}

export const DAILY_GOALS: DailyGoalDef[] = [
  { id: 'dailyPacks', label: 'Open 3 packs', description: 'Buy seed packs from the shop.', target: 3, reward: 75 },
  { id: 'dailyPlanting', label: 'Plant 5 seeds', description: 'Fill empty plots with fresh seeds.', target: 5, reward: 100 },
  { id: 'dailyIncome', label: 'Earn $500', description: 'Collect passive income from your farm.', target: 500, reward: 150 },
  { id: 'dailyReforge', label: 'Reforge once', description: 'Attempt a seed upgrade.', target: 1, reward: 125 },
];

export type AchievementId = 'firstHarvest' | 'packCollector' | 'plotPlanner' | 'rareFarmer' | 'reforgeApprentice';

export interface AchievementDef {
  id: AchievementId;
  label: string;
  description: string;
  target: number;
  reward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstHarvest', label: 'First Harvest', description: 'Earn $250 total from your farm.', target: 250, reward: 150 },
  { id: 'packCollector', label: 'Pack Collector', description: 'Open 25 seed packs.', target: 25, reward: 350 },
  { id: 'plotPlanner', label: 'Plot Planner', description: 'Unlock 6 farm plots.', target: 6, reward: 500 },
  { id: 'rareFarmer', label: 'Rare Farmer', description: 'Own or plant a Legendary seed.', target: 1, reward: 900 },
  { id: 'reforgeApprentice', label: 'Reforge Apprentice', description: 'Attempt 10 reforges.', target: 10, reward: 650 },
];

// === SKILL TREE ===
export type SkillId = 'packDiscount' | 'yieldBoost' | 'speedBoost' | 'autoWater';

export interface SkillTier {
  cost: number;
  effect: number; // meaning depends on skill
  label: string;
}

export interface SkillDef {
  id: SkillId;
  name: string;
  emoji: string;
  description: string;
  tiers: SkillTier[];
}

export const SKILLS: SkillDef[] = [
  {
    id: 'packDiscount',
    name: 'Pack Discount',
    emoji: '🏷️',
    description: 'Reduce pack prices',
    tiers: [
      { cost: 1, effect: 5, label: '5% off' },
      { cost: 2, effect: 10, label: '10% off' },
      { cost: 3, effect: 15, label: '15% off' },
    ],
  },
  {
    id: 'yieldBoost',
    name: 'Yield Boost',
    emoji: '📈',
    description: 'Increase income per seed',
    tiers: [
      { cost: 1, effect: 25, label: '+25%' },
      { cost: 2, effect: 50, label: '+50%' },
      { cost: 3, effect: 100, label: '+100%' },
    ],
  },
  {
    id: 'speedBoost',
    name: 'Speed Boost',
    emoji: '⚡',
    description: 'Faster base income ticks',
    tiers: [
      { cost: 1, effect: 9000, label: '9s ticks' },
      { cost: 2, effect: 7000, label: '7s ticks' },
      { cost: 4, effect: 5000, label: '5s ticks' },
    ],
  },
  {
    id: 'autoWater',
    name: 'Auto-Water',
    emoji: '🤖',
    description: 'Automatically water plots',
    tiers: [
      { cost: 2, effect: 20 * 60 * 1000, label: 'Every 20min' },
      { cost: 3, effect: 15 * 60 * 1000, label: 'Every 15min' },
      { cost: 4, effect: 10 * 60 * 1000, label: 'Every 10min' },
    ],
  },
];
