import { useState, useMemo } from 'react';
import { useGame, rollPack } from '../game/state';
import { SEED_EMOJIS, REFORGE_RATES, getNextRarity, type Seed, type SeedType, type Rarity } from '../game/constants';
import { SFX } from '../game/sounds';
import { toast } from 'sonner';

export default function Reforge() {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: boolean; seed?: Seed; rarity: Rarity } | null>(null);
  const [animating, setAnimating] = useState(false);

  // Group inventory by type+rarity
  const groups = useMemo(() => {
    const map = new Map<string, Seed[]>();
    state.inventory.forEach(seed => {
      const key = `${seed.type}_${seed.rarity}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(seed);
    });
    return map;
  }, [state.inventory]);

  // Filter to groups with 3+ seeds and not Legendary
  const reforgeable = useMemo(() => {
    const entries: { type: SeedType; rarity: Rarity; seeds: Seed[]; rate: number }[] = [];
    groups.forEach((seeds, key) => {
      const [type, rarity] = key.split('_') as [SeedType, Rarity];
      if (rarity === 'Legendary') return;
      if (seeds.length < 3) return;
      entries.push({ type, rarity, seeds, rate: REFORGE_RATES[rarity] || 0 });
    });
    return entries;
  }, [groups]);

  const handleSelect = (seedId: string) => {
    setSelected(prev => {
      if (prev.includes(seedId)) return prev.filter(id => id !== seedId);
      if (prev.length >= 3) return prev;
      return [...prev, seedId];
    });
  };

  const canReforge = selected.length === 3 && (() => {
    const seeds = selected.map(id => state.inventory.find(s => s.id === id)).filter(Boolean) as Seed[];
    if (seeds.length !== 3) return false;
    return new Set(seeds.map(s => s.type)).size === 1 && new Set(seeds.map(s => s.rarity)).size === 1;
  })();

  const selectedSeeds = selected.map(id => state.inventory.find(s => s.id === id)).filter(Boolean) as Seed[];
  const selectedRarity = selectedSeeds.length > 0 ? selectedSeeds[0].rarity : null;
  const nextRarity = selectedRarity ? getNextRarity(selectedRarity) : null;
  const successRate = selectedRarity ? (REFORGE_RATES[selectedRarity] || 0) : 0;

  const handleReforge = () => {
    if (!canReforge || animating) return;
    SFX.buttonClick();
    setAnimating(true);
    setResult(null);

    const rarity = selectedSeeds[0].rarity;
    const seedType = selectedSeeds[0].type;
    const next = getNextRarity(rarity)!;
    const rate = REFORGE_RATES[rarity] || 0;
    const success = Math.random() * 100 < rate;

    // Dispatch reforge
    dispatch({ type: 'REFORGE', seedIds: [...selected], success });

    setTimeout(() => {
      if (success) {
        SFX.reforgeSuccess();
        setResult({ success: true, rarity: next });
        toast.success(`Reforge success! Got ${next} ${seedType}! ✨`);
      } else {
        SFX.reforgeFail();
        setResult({ success: false, rarity });
        toast.error(`Reforge failed! Seeds lost 💔`);
      }
      setSelected([]);
      setAnimating(false);
    }, 1000);
  };

  return (
    <div className="p-4">
      <h2 className="font-heading text-xs mb-2 text-accent">Reforge</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Select 3 seeds of the same type & rarity to attempt an upgrade.
      </p>

      {/* Selected slots */}
      <div className="flex justify-center gap-3 mb-4">
        {[0, 1, 2].map(i => {
          const seed = selectedSeeds[i];
          return (
            <div key={i} className={`w-16 h-16 bg-card border-2 rounded flex flex-col items-center justify-center transition-all
              ${seed ? 'border-accent' : 'border-border border-dashed'}`}>
              {seed ? (
                <>
                  <span className="text-xl">{SEED_EMOJIS[seed.type]}</span>
                  <span className="text-[7px] font-heading" style={{ color: getRarityHsl(seed.rarity) }}>{seed.rarity}</span>
                </>
              ) : (
                <span className="text-muted-foreground text-xs">?</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Rate + button */}
      {canReforge && nextRarity && (
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            → <span style={{ color: getRarityHsl(nextRarity) }} className="font-heading text-[10px]">{nextRarity}</span> ({successRate}% chance)
          </p>
          <button
            onClick={handleReforge}
            disabled={animating}
            className="bg-accent text-accent-foreground font-heading text-[10px] px-6 py-2 rounded hover:brightness-110 transition-all disabled:opacity-50"
          >
            {animating ? '⚗️ Reforging...' : '⚗️ Reforge!'}
          </button>
        </div>
      )}

      {/* Result animation */}
      {result && (
        <div className={`text-center mb-4 p-4 rounded border-2 ${result.success ? 'border-accent bg-accent/10' : 'border-destructive bg-destructive/10'} animate-scale-in`}>
          <span className="text-3xl">{result.success ? '✨' : '💔'}</span>
          <p className="font-heading text-[10px] mt-2" style={{ color: result.success ? getRarityHsl(result.rarity) : undefined }}>
            {result.success ? `Got ${result.rarity}!` : 'Failed!'}
          </p>
        </div>
      )}

      {/* Seed grid for selection */}
      {state.inventory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">⚗️</p>
          <p>No seeds to reforge. Buy some packs!</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[40vh] overflow-y-auto pr-1">
          {state.inventory.map(seed => {
            const isSelected = selected.includes(seed.id);
            const isLegendary = seed.rarity === 'Legendary';
            // Disable if 3 selected and this isn't one, or if doesn't match type/rarity
            const disabled = isLegendary || (selected.length >= 3 && !isSelected) ||
              (selected.length > 0 && !isSelected && (
                selectedSeeds[0].type !== seed.type || selectedSeeds[0].rarity !== seed.rarity
              ));

            return (
              <button
                key={seed.id}
                onClick={() => !disabled && handleSelect(seed.id)}
                disabled={disabled}
                className={`bg-card border-2 rounded p-2 flex flex-col items-center gap-0.5 transition-all
                  ${isSelected ? 'border-accent scale-105' : 'border-border'}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent/50 cursor-pointer'}
                `}
              >
                <span className="text-xl">{SEED_EMOJIS[seed.type]}</span>
                <span className="text-[7px] font-heading" style={{ color: getRarityHsl(seed.rarity) }}>
                  {seed.rarity}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getRarityHsl(rarity: string) {
  const map: Record<string, string> = {
    Common: 'hsl(0 0% 60%)',
    Uncommon: 'hsl(120 40% 45%)',
    Rare: 'hsl(210 70% 55%)',
    Epic: 'hsl(270 60% 55%)',
    Legendary: 'hsl(42 90% 55%)',
  };
  return map[rarity] || 'inherit';
}
