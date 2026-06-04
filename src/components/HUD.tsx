import { useGame } from '../game/state';
import { SEED_EMOJIS, xpForLevel } from '../game/constants';
import { isMuted, toggleMute, SFX } from '../game/sounds';
import { useState } from 'react';
import CoinIcon from './CoinIcon';

export default function HUD() {
  const { state, dispatch, totalIncome, currentInterval, marketBonus } = useGame();
  const [muted, setMuted] = useState(isMuted());

  const xpNeeded = xpForLevel(state.level);
  const xpPercent = Math.floor((state.xp / xpNeeded) * 100);

  const handleMuteToggle = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  return (
    <div className="border-b border-border/60 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="font-heading text-xl text-primary font-bold tracking-tight sm:text-2xl">🌾 Cozy Harvest</h1>
          <p className="text-xs text-muted-foreground">Daily market: {SEED_EMOJIS[marketBonus.seedType]} {marketBonus.seedType} pays {marketBonus.multiplier}x</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMuteToggle}
            className="rounded-xl border border-border/60 bg-white/70 p-2 text-xl shadow-sm transition-transform hover:scale-105"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-100/80 px-4 py-2 shadow-sm">
            <CoinIcon />
            <span className="font-heading text-sm font-semibold text-amber-800">${Math.floor(state.money)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-heading text-xs font-semibold text-primary/90 whitespace-nowrap px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
          Lv.{state.level}
        </span>
        <div className="flex-1 h-3 bg-muted/60 rounded-full overflow-hidden border border-border/30 shadow-inner">
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
