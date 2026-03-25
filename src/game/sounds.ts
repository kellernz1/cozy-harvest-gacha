// === WEB AUDIO SOUND SYSTEM ===

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  if (muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNotes(notes: [number, number][], type: OscillatorType = 'square', volume = 0.12) {
  if (muted) return;
  const ctx = getCtx();
  let time = ctx.currentTime;
  notes.forEach(([freq, dur]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
    time += dur * 0.8;
  });
}

export const SFX = {
  coinTick: () => playTone(880, 0.08, 'square', 0.08),
  packOpen: () => playNotes([[440, 0.1], [554, 0.1], [659, 0.15]], 'square', 0.12),
  reforgeSuccess: () => playNotes([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.2]], 'square', 0.15),
  reforgeFail: () => playNotes([[330, 0.15], [220, 0.25]], 'sawtooth', 0.1),
  plant: () => playTone(523, 0.12, 'triangle', 0.1),
  remove: () => playTone(220, 0.15, 'sawtooth', 0.08),
  unlockPlot: () => playNotes([[392, 0.1], [523, 0.1], [659, 0.15]], 'triangle', 0.12),
  levelUp: () => playNotes([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.25]], 'triangle', 0.18),
  tabSwitch: () => playTone(660, 0.05, 'square', 0.05),
  buttonClick: () => playTone(440, 0.04, 'square', 0.06),
  water: () => playNotes([[600, 0.06], [800, 0.06], [700, 0.08]], 'sine', 0.1),
};
