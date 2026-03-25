import { useGame } from '../game/state';
import { xpForLevel } from '../game/constants';
import { isMuted, toggleMute, SFX } from '../game/sounds';
import { useState } from 'react';

export default function HUD() {
  const { state, dispatch, totalIncome, currentInterval } = useGame();
  const [muted, setMuted] = useState(isMuted());

  const xpNeeded = xpForLevel(state.level);
  const xpPercent = Math.floor((state.xp / xpNeeded) * 100);

  const handleMuteToggle = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  return (
    <div className="px-4 py-3 bg-card border-b-2 border-border">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-xs sm:text-sm text-accent">🌾 Farm Gacha</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMuteToggle}
            className="text-lg hover:scale-110 transition-transform"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded border border-border">
            <span className="text-lg">🪙</span>
            <span className="font-heading text-xs text-coin">${Math.floor(state.money)}</span>
          </div>
        </div>
      </div>

      {/* Level + XP bar */}
      <div className="flex items-center gap-3">
        <span className="font-heading text-[9px] text-accent whitespace-nowrap">Lv.{state.level}</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{state.xp}/{xpNeeded} XP</span>
        {totalIncome > 0 && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            +${totalIncome}/{currentInterval / 1000}s
          </span>
        )}
      </div>
    </div>
  );
}
