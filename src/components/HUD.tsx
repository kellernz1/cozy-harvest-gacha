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
    <div className="px-6 py-4 backdrop-blur-xl bg-card/30 border-b border-border/50 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-heading text-lg sm:text-xl text-primary font-semibold tracking-tight">🌾 Farm Gacha</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMuteToggle}
            className="text-xl hover:scale-110 transition-transform p-2 rounded-xl hover:bg-white/5"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <div className="flex items-center gap-2 backdrop-blur-md bg-gradient-to-br from-amber-500/20 to-yellow-500/20 px-4 py-2 rounded-xl border border-amber-500/30 shadow-lg">
            <span className="text-xl">🪙</span>
            <span className="font-heading text-sm font-semibold text-amber-300">${Math.floor(state.money)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-heading text-xs font-semibold text-primary/90 whitespace-nowrap px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
          Lv.{state.level}
        </span>
        <div className="flex-1 h-3 bg-muted/50 backdrop-blur-sm rounded-full overflow-hidden border border-border/30 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 shadow-lg"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{state.xp}/{xpNeeded} XP</span>
        {totalIncome > 0 && (
          <span className="text-xs text-primary/80 whitespace-nowrap font-medium">
            +${totalIncome}/{currentInterval / 1000}s
          </span>
        )}
      </div>
    </div>
  );
}
