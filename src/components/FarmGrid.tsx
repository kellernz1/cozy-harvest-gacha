import { useState } from 'react';
import { useGame } from '../game/state';
import { PLOT_COSTS, RARITY_INCOME, SEED_EMOJIS, type Seed } from '../game/constants';
import { toast } from 'sonner';

export default function FarmGrid() {
  const { state, dispatch, floatingIncomes } = useGame();

  const handleUnlock = (index: number) => {
    const cost = PLOT_COSTS[index];
    if (state.money < cost) {
      toast.error(`Not enough coins! Need $${cost}`);
      return;
    }
    dispatch({ type: 'UNLOCK_PLOT', plotIndex: index });
    toast.success(`Plot ${index + 1} unlocked! 🌱`);
  };

  const handleRemove = (index: number) => {
    const plot = state.plots[index];
    if (!plot.seed) return;
    const refund = Math.floor(RARITY_INCOME[plot.seed.rarity] * 0.1);
    if (window.confirm(`Remove ${SEED_EMOJIS[plot.seed.type]} ${plot.seed.type}? You'll get $${refund} back (10% refund). The seed will be lost!`)) {
      dispatch({ type: 'REMOVE_SEED', plotIndex: index });
      toast(`Removed seed. Refunded $${refund}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-heading text-xs mb-4 text-accent">Your Farm</h2>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {state.plots.map((plot, i) => (
          <div key={i} className="relative">
            {/* Floating income */}
            {floatingIncomes.has(i) && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary font-heading text-xs animate-float-up z-10 pointer-events-none">
                +${floatingIncomes.get(i)}
              </div>
            )}

            {!plot.unlocked ? (
              <button
                onClick={() => handleUnlock(i)}
                className="w-full aspect-square bg-plot-locked rounded border-2 border-border flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors"
              >
                <span className="text-2xl">🔒</span>
                <span className="font-heading text-[8px] text-muted-foreground">${PLOT_COSTS[i]}</span>
              </button>
            ) : plot.seed ? (
              <div className="w-full aspect-square bg-plot-empty rounded border-2 border-primary/30 flex flex-col items-center justify-center gap-1 relative">
                <span className="text-3xl">{SEED_EMOJIS[plot.seed.type]}</span>
                <span className="text-xs text-foreground">{plot.seed.type}</span>
                <span className={`text-[10px] font-heading text-${getRarityColor(plot.seed.rarity)}`}>
                  {plot.seed.rarity}
                </span>
                <button
                  onClick={() => handleRemove(i)}
                  className="absolute top-1 right-1 text-xs bg-destructive/80 text-destructive-foreground rounded px-1 hover:bg-destructive transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="w-full aspect-square bg-plot-empty rounded border-2 border-dashed border-primary/20 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">Empty</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getRarityColor(rarity: string) {
  const map: Record<string, string> = {
    Common: 'rarity-common',
    Uncommon: 'rarity-uncommon',
    Rare: 'rarity-rare',
    Epic: 'rarity-epic',
    Legendary: 'rarity-legendary',
  };
  return map[rarity] || 'foreground';
}
