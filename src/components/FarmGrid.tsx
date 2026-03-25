import { useState, useEffect } from 'react';
import { useGame } from '../game/state';
import { PLOT_COSTS, PLOT_LEVEL_REQUIREMENTS, RARITY_INCOME, SEED_EMOJIS, type Seed } from '../game/constants';
import { SFX } from '../game/sounds';
import { toast } from 'sonner';

export default function FarmGrid() {
  const { state, dispatch, floatingIncomes } = useGame();
  const [, forceUpdate] = useState(0);

  // Re-render every second for countdowns
  useEffect(() => {
    const t = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleUnlock = (index: number) => {
    const cost = PLOT_COSTS[index];
    const levelReq = PLOT_LEVEL_REQUIREMENTS[index];
    if (state.level < levelReq) {
      toast.error(`Need Level ${levelReq}!`);
      return;
    }
    if (state.money < cost) {
      toast.error(`Not enough coins! Need $${cost}`);
      return;
    }
    SFX.unlockPlot();
    dispatch({ type: 'UNLOCK_PLOT', plotIndex: index });
    toast.success(`Plot ${index + 1} unlocked! 🌱`);
  };

  const handleRemove = (index: number) => {
    const plot = state.plots[index];
    if (!plot.seed) return;
    const refund = Math.floor(RARITY_INCOME[plot.seed.rarity] * 0.1);
    if (window.confirm(`Remove ${SEED_EMOJIS[plot.seed.type]} ${plot.seed.type}? You'll get $${refund} back (10% refund). The seed will be lost!`)) {
      SFX.remove();
      dispatch({ type: 'REMOVE_SEED', plotIndex: index });
      toast(`Removed seed. Refunded $${refund}`);
    }
  };

  const handleWater = (index: number) => {
    SFX.water();
    dispatch({ type: 'WATER_PLOT', plotIndex: index });
    toast.success('Watered! 💧 2× income for 5min');
  };

  const handleFertilize = (index: number) => {
    if (state.fertilizers <= 0) {
      toast.error('No fertilizer! Buy from Shop.');
      return;
    }
    SFX.buttonClick();
    dispatch({ type: 'APPLY_FERTILIZER', plotIndex: index });
    toast.success('Fertilized! 🌿 2× income for 10min');
  };

  const now = Date.now();

  return (
    <div className="p-4">
      <h2 className="font-heading text-xs mb-4 text-accent">Your Farm</h2>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {state.plots.map((plot, i) => {
          const isWatered = plot.wateredUntil != null && plot.wateredUntil > now;
          const isFertilized = plot.fertilizedUntil != null && plot.fertilizedUntil > now;

          return (
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
                  disabled={state.money < PLOT_COSTS[i] || state.level < PLOT_LEVEL_REQUIREMENTS[i]}
                  className="w-full aspect-square bg-plot-locked rounded border-2 border-border flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl">🔒</span>
                  <span className="font-heading text-[8px] text-muted-foreground">${PLOT_COSTS[i]}</span>
                  {PLOT_LEVEL_REQUIREMENTS[i] > 1 && (
                    <span className="font-heading text-[7px] text-accent">Lv.{PLOT_LEVEL_REQUIREMENTS[i]}</span>
                  )}
                </button>
              ) : plot.seed ? (
                <div className={`w-full aspect-square bg-plot-empty rounded border-2 flex flex-col items-center justify-center gap-0.5 relative
                  ${isWatered ? 'border-blue-400/60' : 'border-primary/30'}
                  ${!isWatered && plot.seed ? 'opacity-80' : ''}
                `}>
                  {/* Status indicators */}
                  <div className="absolute top-1 left-1 flex gap-0.5">
                    {isWatered && <span className="text-[10px]" title={`Water: ${formatTime(plot.wateredUntil! - now)}`}>💧</span>}
                    {isFertilized && <span className="text-[10px]" title={`Fert: ${formatTime(plot.fertilizedUntil! - now)}`}>🌿</span>}
                  </div>

                  <span className="text-2xl">{SEED_EMOJIS[plot.seed.type]}</span>
                  <span className="text-[10px] text-foreground">{plot.seed.type}</span>
                  <span className={`text-[8px] font-heading text-rarity-${plot.seed.rarity.toLowerCase()}`}>
                    {plot.seed.rarity}
                  </span>

                  {/* Countdown timers */}
                  <div className="flex gap-1 text-[7px] text-muted-foreground">
                    {isWatered && <span>💧{formatTime(plot.wateredUntil! - now)}</span>}
                    {isFertilized && <span>🌿{formatTime(plot.fertilizedUntil! - now)}</span>}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute bottom-0.5 left-0.5 right-0.5 flex gap-0.5">
                    <button
                      onClick={() => handleWater(i)}
                      className="flex-1 text-[8px] bg-blue-500/30 text-foreground rounded px-0.5 hover:bg-blue-500/50 transition-colors"
                      title="Water (2× for 5min)"
                    >
                      💧
                    </button>
                    <button
                      onClick={() => handleFertilize(i)}
                      disabled={state.fertilizers <= 0}
                      className="flex-1 text-[8px] bg-primary/30 text-foreground rounded px-0.5 hover:bg-primary/50 transition-colors disabled:opacity-30"
                      title="Fertilize (2× for 10min)"
                    >
                      🌿
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(i)}
                    className="absolute top-1 right-1 text-[8px] bg-destructive/80 text-destructive-foreground rounded px-1 hover:bg-destructive transition-colors"
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
          );
        })}
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}
