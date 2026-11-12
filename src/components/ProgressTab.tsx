import type { Store } from '../app';
import { LIFTS, LIFT_IDS, LiftId, Workout, fmtKg, isSkipped, isSuccess, nextWeight } from '../program';

export function ProgressTab({ store }: { store: Store }) {
  return (
    <>
      <h1>Progress</h1>
      <p class="muted">{store.history.length} workouts logged</p>
      {LIFT_IDS.map((lift) => (
        <LiftChart key={lift} lift={lift} store={store} />
      ))}
    </>
  );
}

function LiftChart({ lift, store }: { lift: LiftId; store: Store }) {
  const points = sessions(lift, store.history);
  const next = nextWeight(lift, store.history, store.settings);
  const best = points.filter((p) => p.ok).reduce((m, p) => Math.max(m, p.weight), 0);

  return (
    <section class="card">
      <div class="title-row">
        <h2>{LIFTS[lift].name}</h2>
        <span class="muted">next {fmtKg(next.weight)} kg</span>
      </div>
      <p class="muted small">
        {points.length} sessions{best > 0 && ` · best 5×5 ${fmtKg(best)} kg`}
      </p>
      {points.length >= 2 ? <Chart points={points} /> : <p class="muted small">Log at least two sessions to see a chart.</p>}
    </section>
  );
}

interface Point {
  t: number;
  weight: number;
  ok: boolean;
}

function sessions(lift: LiftId, history: Workout[]): Point[] {
  return history
    .flatMap((w) => w.entries.filter((e) => e.lift === lift && !isSkipped(e)).map((e) => ({ t: w.startedAt, weight: e.weight, ok: isSuccess(e) })))
    .reverse();
}

function Chart({ points }: { points: Point[] }) {
  const W = 320;
  const H = 140;
  const pad = { l: 34, r: 8, t: 10, b: 20 };
  const ws = points.map((p) => p.weight);
  const lo = Math.floor(Math.min(...ws) / 5) * 5;
  const hi = Math.max(lo + 5, Math.ceil(Math.max(...ws) / 5) * 5);
  const t0 = points[0].t;
  const t1 = Math.max(t0 + 1, points[points.length - 1].t);
  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (w: number) => pad.t + (1 - (w - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const fmtDay = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <svg class="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Working weight over time">
      {[lo, (lo + hi) / 2, hi].map((g) => (
        <g key={g}>
          <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} class="grid" />
          <text x={pad.l - 6} y={y(g) + 4} text-anchor="end" class="axis">
            {fmtKg(g)}
          </text>
        </g>
      ))}
      <polyline class="line" points={points.map((p) => `${x(p.t)},${y(p.weight)}`).join(' ')} />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.t)} cy={y(p.weight)} r={3.5} class={p.ok ? 'pt-ok' : 'pt-fail'} />
      ))}
      <text x={pad.l} y={H - 4} class="axis">
        {fmtDay(t0)}
      </text>
      <text x={W - pad.r} y={H - 4} text-anchor="end" class="axis">
        {fmtDay(t1)}
      </text>
    </svg>
  );
}
