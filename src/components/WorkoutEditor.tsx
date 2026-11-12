import { useState } from 'preact/hooks';
import { LIFTS, LiftEntry, Settings, Workout, fmtKg, nextWeight, platesPerSide, restAfterSet, tapSet, warmups } from '../program';
import { unlockAudio } from '../device';

interface SetTap {
  reps: number;
  fresh: boolean;
}

interface Props {
  workout: Workout;
  settings: Settings;
  history: Workout[];
  live: boolean;
  onChange(w: Workout): void;
}

export function WorkoutEditor({ workout, settings, history, live, onChange }: Props) {
  const setEntry = (i: number, e: LiftEntry, tapped?: SetTap) => {
    const entries = workout.entries.map((x, j) => (j === i ? e : x));
    const next: Workout = { ...workout, entries };
    if (tapped?.fresh) next.rest = restAfterSet(e, tapped.reps, settings, Date.now());
    else if (tapped && workout.rest) next.rest = restAfterSet(e, tapped.reps, settings, workout.rest.startedAt);
    onChange(next);
  };

  return (
    <div class="editor">
      {workout.entries.map((e, i) => (
        <LiftCard
          key={e.lift}
          entry={e}
          settings={settings}
          hint={live ? hintFor(e, history, settings) : undefined}
          onChange={(ne, tapped) => setEntry(i, ne, live ? tapped : undefined)}
        />
      ))}
      <div class="card extras">
        <label>
          Peso corporal (kg)
          <NumberInput value={workout.bodyweight} onChange={(v) => onChange({ ...workout, bodyweight: v })} />
        </label>
        <label>
          Notas
          <textarea rows={2} value={workout.notes ?? ''} onInput={(ev) => onChange({ ...workout, notes: (ev.target as HTMLTextAreaElement).value })} />
        </label>
      </div>
    </div>
  );
}

function hintFor(e: LiftEntry, history: Workout[], settings: Settings) {
  const n = nextWeight(e.lift, history, settings);
  if (n.weight !== e.weight) return 'Peso ajustado a mano';
  if (n.reason === 'deload') return `Descarga después de ${n.failures} sesiones fallidas`;
  if (n.reason === 'repeat') return `Fallaste la última vez (${n.failures} de ${settings.failuresBeforeDeload} antes de la descarga)`;
  return undefined;
}

function LiftCard({ entry, settings, hint, onChange }: { entry: LiftEntry; settings: Settings; hint?: string; onChange(e: LiftEntry, tapped?: SetTap): void }) {
  const [editing, setEditing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const lift = LIFTS[entry.lift];
  const step = settings.increments[entry.lift] === 5 ? 5 : 2.5;

  const tap = (i: number) => {
    unlockAudio();
    const was = entry.sets[i];
    const v = tapSet(was, entry.reps);
    onChange({ ...entry, sets: entry.sets.map((s, j) => (j === i ? v : s)) }, v === null ? undefined : { reps: v, fresh: was === null });
  };

  return (
    <section class="card lift">
      <header>
        <h2>{lift.name}</h2>
        <span class="scheme">
          {entry.sets.length}×{entry.reps}
        </span>
        <button class="weight" onClick={() => setEditing(!editing)}>
          {fmtKg(entry.weight)} kg
        </button>
      </header>
      {hint && <p class="hint">{hint}</p>}
      {editing && (
        <div class="weight-edit">
          <button onClick={() => onChange({ ...entry, weight: Math.max(0, entry.weight - step) })}>−{step}</button>
          <NumberInput value={entry.weight} onChange={(v) => v !== undefined && onChange({ ...entry, weight: v })} />
          <button onClick={() => onChange({ ...entry, weight: entry.weight + step })}>+{step}</button>
          <button class="primary" onClick={() => setEditing(false)}>
            Listo
          </button>
        </div>
      )}
      <div class="sets">
        {entry.sets.map((s, i) => (
          <button
            key={i}
            class={`set ${s === null ? '' : s >= entry.reps ? 'ok' : 'fail'}`}
            onClick={() => tap(i)}
            aria-label={`Serie ${i + 1}: ${s === null ? 'sin hacer' : `${s} repeticiones`}`}
          >
            {s ?? entry.reps}
          </button>
        ))}
      </div>
      <button class="link" onClick={() => setShowHelp(!showHelp)}>
        {showHelp ? 'Ocultar' : 'Entrada en calor y discos'}
      </button>
      {showHelp && <LoadingPlan entry={entry} settings={settings} />}
    </section>
  );
}

function LoadingPlan({ entry, settings }: { entry: LiftEntry; settings: Settings }) {
  const rows = [
    ...groupWarmups(warmups(entry.lift, entry.weight, settings.barWeight)).map((w) => ({ ...w, kind: 'Calor' })),
    { sets: entry.sets.length, reps: entry.reps, weight: entry.weight, kind: 'Trabajo' },
  ];
  return (
    <table class="plan">
      <thead>
        <tr>
          <th />
          <th>Series × reps</th>
          <th>kg</th>
          <th>Discos por lado</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const p = platesPerSide(r.weight, settings.barWeight, settings.plates);
          return (
            <tr key={i} class={r.kind === 'Trabajo' ? 'work' : ''}>
              <td>{r.kind}</td>
              <td>
                {r.sets} × {r.reps}
              </td>
              <td>{fmtKg(r.weight)}</td>
              <td>
                {p.plates.length ? p.plates.map(fmtKg).join(' + ') : 'barra sola'}
                {p.remainder > 0 && <span class="warn"> (+{fmtKg(p.remainder)})</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function groupWarmups(ws: { weight: number; reps: number }[]) {
  const out: { sets: number; weight: number; reps: number }[] = [];
  for (const w of ws) {
    const last = out[out.length - 1];
    if (last && last.weight === w.weight && last.reps === w.reps) last.sets++;
    else out.push({ sets: 1, ...w });
  }
  return out;
}

export function NumberInput({ value, onChange }: { value?: number; onChange(v: number | undefined): void }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      type="text"
      inputMode="decimal"
      value={text ?? (value === undefined ? '' : String(value))}
      onFocus={(ev) => (ev.target as HTMLInputElement).select()}
      onInput={(ev) => {
        const t = (ev.target as HTMLInputElement).value;
        setText(t);
        const n = parseFloat(t.replace(',', '.'));
        onChange(t.trim() === '' ? undefined : Number.isFinite(n) ? n : value);
      }}
      onBlur={() => setText(null)}
    />
  );
}
