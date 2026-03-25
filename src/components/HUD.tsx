import { useGame } from '../game/state';
import { RARITY_INCOME } from '../game/constants';

export default function HUD() {
  const { state, totalIncome } = useGame();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-b-2 border-border">
      <h1 className="font-heading text-xs sm:text-sm text-accent">🌾 Farm Gacha</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded border border-border">
          <span className="text-lg">🪙</span>
          <span className="font-heading text-xs text-coin">${Math.floor(state.money)}</span>
        </div>
        {totalIncome > 0 && (
          <span className="text-sm text-muted-foreground font-body">
            +${totalIncome}/10s
          </span>
        )}
      </div>
    </div>
  );
}
