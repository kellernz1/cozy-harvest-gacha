import { useState } from 'react';
import { useGame, rollPack, getDiscountedCost } from '../game/state';
import { PACKS, SEED_EMOJIS, RARITY_INCOME, FERTILIZER_COST, type Seed, type Rarity } from '../game/constants';
import { SFX } from '../game/sounds';
import { toast } from 'sonner';
import CoinIcon from './CoinIcon';

export default function Shop() {
  const { state, dispatch } = useGame();
  const [revealing, setRevealing] = useState<Seed[] | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const handleBuyPack = (packId: number) => {
    const pack = PACKS.find(p => p.id === packId);
    if (!pack) return;
    if (state.level < pack.minLevel) {
      toast.error(`Reach Level ${pack.minLevel} first!`);
      return;
    }
    const cost = getDiscountedCost(pack.cost, state.skills);
    if (state.money < cost) {
      toast.error(`Not enough coins! Need $${cost}`);
      return;
    }

    SFX.packOpen();
    dispatch({ type: 'OPEN_PACK', packId });

    const seeds = rollPack(packId);
    setRevealing(seeds);
    setRevealedCount(0);

    seeds.forEach((_, i) => {
      setTimeout(() => {
        setRevealedCount(i + 1);
        if (i === seeds.length - 1) {
          setTimeout(() => {
            dispatch({ type: 'ADD_SEEDS', seeds });
            setRevealing(null);
            setRevealedCount(0);
            toast.success(`Got ${seeds.length} seed!`);
          }, 1200);
        }
      }, (i + 1) * 600);
    });
  };

  const handleBuyFertilizer = () => {
    if (state.money < FERTILIZER_COST) {
      toast.error(`Not enough coins! Need $${FERTILIZER_COST}`);
      return;
    }
    SFX.buttonClick();
    dispatch({ type: 'BUY_FERTILIZER' });
    toast.success('Bought fertilizer! 🌿');
  };

  const handleReset = () => {
    if (window.confirm('Reset your entire game? All progress will be lost!')) {
      dispatch({ type: 'RESET_GAME' });
      toast('Game reset! Starting fresh 🌱');
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-heading text-xs mb-4 text-accent">Seed Shop</h2>

      <div className="grid gap-3 max-w-md mx-auto">
        {PACKS.map(pack => {
          const cost = getDiscountedCost(pack.cost, state.skills);
          const locked = state.level < pack.minLevel;
          return (
            <div key={pack.id} className={`bg-card border-2 border-border rounded p-4 ${locked ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-heading text-[10px] text-card-foreground">{pack.name}</h3>
                  <p className="text-sm text-muted-foreground">{pack.seedCount} seed</p>
                </div>
                {locked ? (
                  <span className="font-heading text-[10px] text-muted-foreground px-3 py-2">
                    🔒 Level {pack.minLevel}
                  </span>
                ) : (
                  <button
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={state.money < cost || revealing !== null}
                    className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground font-heading text-[10px] px-3 py-2 rounded hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CoinIcon className="h-4 w-4 text-[8px]" /> ${cost}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(pack.rates).map(([rarity, rate]) => (
                  <span key={rarity} className={`text-xs px-1.5 py-0.5 rounded ${getRarityBgClass(rarity as Rarity)}`}>
                    {rarity} {rate}%
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Fertilizer */}
        <div className="bg-card border-2 border-border rounded p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-heading text-[10px] text-card-foreground">🌿 Fertilizer</h3>
              <p className="text-sm text-muted-foreground">2× income for 10min per plot</p>
              <p className="text-xs text-muted-foreground">Owned: {state.fertilizers}</p>
            </div>
            <button
              onClick={handleBuyFertilizer}
              disabled={state.money < FERTILIZER_COST}
              className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-heading text-[10px] px-3 py-2 rounded hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CoinIcon className="h-4 w-4 text-[8px]" /> ${FERTILIZER_COST}
            </button>
          </div>
        </div>
      </div>

      {/* Reveal overlay */}
      {revealing && (
        <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50 p-4">
          {revealedCount > 0 && hasHighRarity(revealing.slice(0, revealedCount)) && (
            <div className="fixed inset-0 bg-rarity-legendary/20 animate-screen-flash pointer-events-none z-40" />
          )}
          <div className="max-w-sm w-full">
            <h3 className="font-heading text-xs text-accent text-center mb-4">Opening Pack...</h3>
            <div className="flex justify-center gap-3">
              {revealing.map((seed, i) => (
                <div
                  key={seed.id}
                  className={`w-20 h-24 bg-card border-2 border-border rounded flex flex-col items-center justify-center gap-1
                    ${i < revealedCount ? 'animate-card-flip' : 'opacity-0'}
                    ${i < revealedCount && (seed.rarity === 'Legendary') ? 'animate-legendary-glow' : ''}
                    ${i < revealedCount && (seed.rarity === 'Epic') ? 'animate-epic-glow' : ''}
                  `}
                >
                  <span className="text-2xl">{SEED_EMOJIS[seed.type]}</span>
                  <span className="text-[8px] font-heading" style={{ color: getRarityHsl(seed.rarity) }}>
                    {seed.rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleReset}
          className="text-xs text-destructive hover:text-destructive/80 font-body transition-colors"
        >
          🗑️ Reset Game
        </button>
      </div>
    </div>
  );
}

function getRarityBgClass(rarity: Rarity) {
  const map: Record<string, string> = {
    Common: 'bg-rarity-common/20 text-rarity-common',
    Uncommon: 'bg-rarity-uncommon/20 text-rarity-uncommon',
    Rare: 'bg-rarity-rare/20 text-rarity-rare',
    Epic: 'bg-rarity-epic/20 text-rarity-epic',
    Legendary: 'bg-rarity-legendary/20 text-rarity-legendary',
  };
  return map[rarity] || '';
}

function getRarityHsl(rarity: Rarity) {
  const map: Record<string, string> = {
    Common: 'hsl(0 0% 60%)',
    Uncommon: 'hsl(120 40% 45%)',
    Rare: 'hsl(210 70% 55%)',
    Epic: 'hsl(270 60% 55%)',
    Legendary: 'hsl(42 90% 55%)',
  };
  return map[rarity] || 'inherit';
}

function hasHighRarity(seeds: Seed[]) {
  return seeds.some(s => s.rarity === 'Epic' || s.rarity === 'Legendary');
}
