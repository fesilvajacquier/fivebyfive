import { useState } from 'preact/hooks';
import { LIFTS, LiftEntry, Settings, Workout, fmtKg, nextWeight, platesPerSide, tapSet, warmups } from '../program';
import { unlockAudio } from '../device';

interface Props {
  workout: Workout;
  settings: Settings;
  history: Workout[];
  live: boolean;
  onChange(w: Workout): void;
}

export function WorkoutEditor({ workout, settings, history, live, onChange }: Props) {
  const setEntry = (i: number, e: LiftEntry, completedReps?: number) => {
    const entries = workout.entries.map((x, j) => (j === i ? e : x));
    const next: Workout = { ...workout, entries };
    if (completedReps !== undefined) {
      const allDone = entries.every((x) => x.sets.every((s) => s !== null));
      next.rest = allDone
        ? undefined
        : { startedAt: Date.now(), durationSec: completedReps >= e.reps ? settings.restSuccessSec : settings.restFailSec };
    }
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
          onChange={(ne, completedReps) => setEntry(i, ne, live ? completedReps : undefined)}
        />
      ))}
      <div class="card extras">
        <label>
          Bodyweight (kg)
          <NumberInput value={workout.bodyweight} onChange={(v) => onChange({ ...workout, bodyweight: v })} />
        </label>
        <label>
          Notes
          <textarea rows={2} value={workout.notes ?? ''} onInput={(ev) => onChange({ ...workout, notes: (ev.target as HTMLTextAreaElement).value })} />
        </label>
      </div>
    </div>
  );
}

function hintFor(e: LiftEntry, history: Workout[], settings: Settings) {
  const n = nextWeight(e.lift, history, settings);
  if (n.weight !== e.weight) return 'Weight adjusted manually';
  if (n.reason === 'deload') return `Deload after ${n.failures} failed sessions`;
  if (n.reason === 'repeat') return `Failed last time (${n.failures}/${settings.failuresBeforeDeload} before deload)`;
  return undefined;
}

function LiftCard({ entry, settings, hint, onChange }: { entry: LiftEntry; settings: Settings; hint?: string; onChange(e: LiftEntry, completedReps?: number): void }) {
  const [editing, setEditing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const lift = LIFTS[entry.lift];
  const step = settings.increments[entry.lift] === 5 ? 5 : 2.5;
  const plates = platesPerSide(entry.weight, settings.barWeight, settings.plates);

  const tap = (i: number) => {
    unlockAudio();
    const was = entry.sets[i];
    const v = tapSet(was, entry.reps);
    onChange({ ...entry, sets: entry.sets.map((s, j) => (j === i ? v : s)) }, was === null && v !== null ? v : undefined);
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
            Done
          </button>
        </div>
      )}
      <div class="sets">
        {entry.sets.map((s, i) => (
          <button
            key={i}
            class={`set ${s === null ? '' : s >= entry.reps ? 'ok' : 'fail'}`}
            onClick={() => tap(i)}
            aria-label={`Set ${i + 1}: ${s === null ? 'not done' : `${s} reps`}`}
          >
            {s ?? entry.reps}
          </button>
        ))}
      </div>
      <button class="link" onClick={() => setShowHelp(!showHelp)}>
        {showHelp ? 'Hide' : 'Warm-up & plates'}
      </button>
      {showHelp && (
        <div class="help">
          <p>
            <strong>Per side:</strong>{' '}
            {plates.plates.length ? plates.plates.map(fmtKg).join(' + ') : 'empty bar'}
            {plates.remainder > 0 && <span class="warn"> (+{fmtKg(plates.remainder)} kg not loadable)</span>}
          </p>
          <p>
            <strong>Warm-up:</strong>{' '}
            {warmups(entry.lift, entry.weight, settings.barWeight)
              .map((w) => `${w.reps}×${fmtKg(w.weight)}`)
              .join(', ') || 'none'}
          </p>
        </div>
      )}
    </section>
  );
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
