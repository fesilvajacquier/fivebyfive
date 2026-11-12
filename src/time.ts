export const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export function daysAgo(ms: number) {
  const d = Math.floor((Date.now() - ms) / 86_400_000);
  return d === 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`;
}
