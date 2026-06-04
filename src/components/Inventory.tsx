import { useState } from 'react';
import { getSeedValue, useGame } from '../game/state';
import { RARITY_INCOME, SEED_EMOJIS, type Seed } from '../game/constants';
import { SFX } from '../game/sounds';
import { toast } from 'sonner';
import PlotPickerModal from './PlotPickerModal';

export default function Inventory() {
  const { state, dispatch } = useGame();
  const [plantingSeed, setPlantingSeed] = useState<Seed | null>(null);

  const handleSell = (seed: Seed) => {
    const value = getSeedValue(seed);
    SFX.buttonClick();
    dispatch({ type: 'SELL_SEED', seedId: seed.id });
    toast.success(`Sold ${SEED_EMOJIS[seed.type]} ${seed.type} for $${value}!`);
  };

  const handlePlant = (seed: Seed) => {
    const hasEmpty = state.plots.some(p => p.unlocked && !p.seed);
    if (!hasEmpty) {
      toast.error('No empty plots available!');
      return;
    }
    SFX.buttonClick();
    setPlantingSeed(seed);
  };

  const handlePlotSelect = (plotIndex: number) => {
    if (!plantingSeed) return;
    SFX.plant();
    dispatch({ type: 'PLANT_SEED', seedId: plantingSeed.id, plotIndex });
    toast.success(`Planted ${SEED_EMOJIS[plantingSeed.type]} ${plantingSeed.type}! 🌱`);
    setPlantingSeed(null);
  };

  return (
    <div className="p-4">
      <h2 className="font-heading text-xs mb-4 text-accent">Inventory ({state.inventory.length})</h2>

      {state.inventory.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-3xl mb-2">🌱</p>
          <p>No seeds yet! Visit the Shop to buy packs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {state.inventory.map((seed) => (
            <SeedCard
              key={seed.id}
              seed={seed}
              onPlant={() => handlePlant(seed)}
              onSell={() => handleSell(seed)}
            />
          ))}
        </div>
      )}

      {plantingSeed && (
        <PlotPickerModal
          seed={plantingSeed}
          onSelect={handlePlotSelect}
          onClose={() => setPlantingSeed(null)}
        />
      )}
    </div>
  );
}

function SeedCard({ seed, onPlant, onSell }: { seed: Seed; onPlant: () => void; onSell: () => void }) {
  const income = RARITY_INCOME[seed.rarity];
  const sellValue = getSeedValue(seed);
  const isLegendary = seed.rarity === 'Legendary';
  const isEpic = seed.rarity === 'Epic';

  return (
    <div
      className={`bg-card rounded border-2 border-border p-3 flex flex-col items-center gap-1 transition-all
        ${isLegendary ? 'animate-legendary-glow' : ''}
        ${isEpic ? 'animate-epic-glow' : ''}
      `}
    >
      <span className="text-3xl">{SEED_EMOJIS[seed.type]}</span>
      <span className="text-sm text-card-foreground">{seed.type}</span>
      <RarityBadge rarity={seed.rarity} />
      <span className="text-xs text-muted-foreground">${income}/10s</span>
      <div className="flex gap-1 mt-1 w-full">
        <button
          onClick={onPlant}
          className="flex-1 text-xs bg-primary text-primary-foreground rounded px-2 py-1 hover:brightness-110 transition-all font-body"
        >
          Plant
        </button>
        <button
          onClick={onSell}
          className="flex-1 text-xs bg-secondary text-secondary-foreground rounded px-2 py-1 hover:brightness-110 transition-all font-body"
        >
          Sell ${sellValue}
        </button>
      </div>
    </div>
  );
}

function RarityBadge({ rarity }: { rarity: string }) {
  const colorMap: Record<string, string> = {
    Common: 'bg-rarity-common/20 text-rarity-common',
    Uncommon: 'bg-rarity-uncommon/20 text-rarity-uncommon',
    Rare: 'bg-rarity-rare/20 text-rarity-rare',
    Epic: 'bg-rarity-epic/20 text-rarity-epic',
    Legendary: 'bg-rarity-legendary/20 text-rarity-legendary',
  };

  return (
    <span className={`text-[10px] font-heading px-2 py-0.5 rounded ${colorMap[rarity] || ''} ${rarity === 'Legendary' ? 'animate-shimmer' : ''}`}>
      {rarity}
    </span>
  );
}
