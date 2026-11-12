let ctx: AudioContext | undefined;

export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
}

export function alertRestDone() {
  navigator.vibrate?.([300, 150, 300]);
  if (!ctx) return;
  [0, 0.25, 0.5].forEach((offset) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx!.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + offset + 0.2);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(ctx!.currentTime + offset);
    osc.stop(ctx!.currentTime + offset + 0.2);
  });
}

export function keepScreenOn(): () => void {
  let lock: WakeLockSentinel | undefined;
  let released = false;
  const acquire = async () => {
    if (released || document.visibilityState !== 'visible') return;
    try {
      lock = await navigator.wakeLock?.request('screen');
    } catch {}
  };
  acquire();
  document.addEventListener('visibilitychange', acquire);
  return () => {
    released = true;
    document.removeEventListener('visibilitychange', acquire);
    lock?.release();
  };
}
