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

export type SeedType = 'Apple' | 'Orange' | 'Banana' | 'Strawberry' | 'Blueberry';

export const SEED_EMOJIS: Record<SeedType, string> = {
  Apple: '🍎',
  Orange: '🍊',
  Banana: '🍌',
  Strawberry: '🍓',
  Blueberry: '🫐',
};

export const SEED_TYPES: SeedType[] = ['Apple', 'Orange', 'Banana', 'Strawberry', 'Blueberry'];

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
}

export const PACKS: Pack[] = [
  { id: 1, name: 'Basic Pack', cost: 10, seedCount: 4, rates: { Common: 60, Uncommon: 30, Rare: 10 } },
  { id: 2, name: 'Premium Pack', cost: 25, seedCount: 5, rates: { Common: 45, Uncommon: 30, Rare: 18, Epic: 7 } },
  { id: 3, name: 'Legendary Pack', cost: 75, seedCount: 5, rates: { Uncommon: 40, Rare: 35, Epic: 18, Legendary: 7 } },
];

export const PLOT_COSTS = [0, 10, 20, 40, 80, 160, 320, 640, 1280];

export const TOTAL_PLOTS = 9;

export const INCOME_INTERVAL = 10000; // 10 seconds
export const MAX_OFFLINE_TICKS = 360; // 1 hour = 360 * 10s

export const STORAGE_KEY = 'farmGachaRPG_save';
