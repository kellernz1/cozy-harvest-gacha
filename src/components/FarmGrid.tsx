import { useState, useEffect } from 'react';
import { useGame } from '../game/state';
import { PLOT_COSTS, PLOT_LEVEL_REQUIREMENTS, RARITY_INCOME, SEED_EMOJIS, type Seed } from '../game/constants';
import { SFX } from '../game/sounds';
import { toast } from 'sonner';

export default function FarmGrid() {
  const { state, dispatch, floatingIncomes } = useGame();
  const [, forceUpdate] = useState(0);

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
    <div className="p-6">
      <h2 className="font-heading text-xl font-semibold mb-6 text-primary">Your Farm</h2>
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        {state.plots.map((plot, i) => {
          const isWatered = plot.wateredUntil != null && plot.wateredUntil > now;
          const isFertilized = plot.fertilizedUntil != null && plot.fertilizedUntil > now;

          return (
            <div key={i} className="relative">
              {floatingIncomes.has(i) && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary font-heading text-sm font-semibold animate-float-up z-10 pointer-events-none drop-shadow-lg">
                  +${floatingIncomes.get(i)}
                </div>
              )}

              {!plot.unlocked ? (
                <button
                  onClick={() => handleUnlock(i)}
                  disabled={state.money < PLOT_COSTS[i] || state.level < PLOT_LEVEL_REQUIREMENTS[i]}
                  className="w-full aspect-square backdrop-blur-md bg-gradient-to-br from-muted/50 to-plot-locked/50 rounded-2xl border border-border/50 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                >
                  <span className="text-3xl">🔒</span>
                  <span className="font-body text-xs text-muted-foreground font-medium">${PLOT_COSTS[i]}</span>
                  {PLOT_LEVEL_REQUIREMENTS[i] > 1 && (
                    <span className="font-body text-xs text-primary font-semibold">Lv.{PLOT_LEVEL_REQUIREMENTS[i]}</span>
                  )}
                </button>
              ) : plot.seed ? (
                <div className={`w-full aspect-square backdrop-blur-lg bg-gradient-to-br rounded-2xl border flex flex-col items-center justify-center gap-1 relative shadow-xl transition-all
                  ${isWatered
                    ? 'from-blue-500/20 to-cyan-500/10 border-blue-400/50 shadow-blue-500/20'
                    : 'from-green-500/10 to-emerald-500/5 border-primary/30'}
                  ${!isWatered && plot.seed ? 'opacity-90' : ''}
                `}>
                  <div className="absolute top-2 left-2 flex gap-1">
                    {isWatered && (
                      <span className="text-sm backdrop-blur-md bg-blue-500/30 px-1.5 py-0.5 rounded-lg border border-blue-400/40" title={`Water: ${formatTime(plot.wateredUntil! - now)}`}>
                        💧
                      </span>
                    )}
                    {isFertilized && (
                      <span className="text-sm backdrop-blur-md bg-green-500/30 px-1.5 py-0.5 rounded-lg border border-green-400/40" title={`Fert: ${formatTime(plot.fertilizedUntil! - now)}`}>
                        🌿
                      </span>
                    )}
                  </div>

                  <span className="text-4xl drop-shadow-lg">{SEED_EMOJIS[plot.seed.type]}</span>
                  <span className="text-xs text-foreground font-medium">{plot.seed.type}</span>
                  <span className={`text-xs font-heading font-semibold text-rarity-${plot.seed.rarity.toLowerCase()} px-2 py-0.5 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10`}>
                    {plot.seed.rarity}
                  </span>

                  <div className="flex gap-1 text-[10px] text-muted-foreground font-medium">
                    {isWatered && <span>💧{formatTime(plot.wateredUntil! - now)}</span>}
                    {isFertilized && <span>🌿{formatTime(plot.fertilizedUntil! - now)}</span>}
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => handleWater(i)}
                      className="flex-1 text-sm backdrop-blur-md bg-blue-500/30 text-foreground rounded-lg px-2 py-1 hover:bg-blue-500/50 hover:scale-105 transition-all border border-blue-400/30 shadow-lg"
                      title="Water (2× for 5min)"
                    >
                      💧
                    </button>
                    <button
                      onClick={() => handleFertilize(i)}
                      disabled={state.fertilizers <= 0}
                      className="flex-1 text-sm backdrop-blur-md bg-green-500/30 text-foreground rounded-lg px-2 py-1 hover:bg-green-500/50 hover:scale-105 transition-all disabled:opacity-30 border border-green-400/30 shadow-lg"
                      title="Fertilize (2× for 10min)"
                    >
                      🌿
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(i)}
                    className="absolute top-2 right-2 text-xs backdrop-blur-md bg-destructive/70 text-destructive-foreground rounded-lg px-2 py-1 hover:bg-destructive hover:scale-105 transition-all border border-red-400/30 shadow-lg font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-square backdrop-blur-md bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl border-2 border-dashed border-primary/20 flex items-center justify-center hover:border-primary/40 transition-all shadow-inner">
                  <span className="text-muted-foreground text-sm font-medium">Empty</span>
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
