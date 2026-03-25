import { useGame } from '../game/state';
import { SEED_EMOJIS, PLOT_COSTS, type Seed } from '../game/constants';

interface Props {
  seed: Seed;
  onSelect: (plotIndex: number) => void;
  onClose: () => void;
}

export default function PlotPickerModal({ seed, onSelect, onClose }: Props) {
  const { state } = useGame();

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border-2 border-border rounded p-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading text-xs text-accent mb-3">
          Plant {SEED_EMOJIS[seed.type]} {seed.type}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Select an empty plot:</p>
        <div className="grid grid-cols-3 gap-2">
          {state.plots.map((plot, i) => {
            const canPlant = plot.unlocked && !plot.seed;
            return (
              <button
                key={i}
                disabled={!canPlant}
                onClick={() => canPlant && onSelect(i)}
                className={`aspect-square rounded border-2 flex items-center justify-center text-sm transition-all
                  ${canPlant
                    ? 'border-primary bg-plot-empty hover:border-accent cursor-pointer'
                    : 'border-border bg-muted cursor-not-allowed opacity-50'
                  }`}
              >
                {!plot.unlocked ? '🔒' : plot.seed ? SEED_EMOJIS[plot.seed.type] : '✓'}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm bg-secondary text-secondary-foreground rounded py-2 hover:brightness-110 transition-all font-body"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
