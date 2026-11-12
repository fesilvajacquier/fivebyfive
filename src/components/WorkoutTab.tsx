import { useEffect, useRef, useState } from 'preact/hooks';
import type { Store } from '../app';
import { LIFTS, Rest, WORKOUTS, WorkoutType, estimateWorkoutSec, fmtKg, nextWeight, nextWorkoutType } from '../program';
import { WorkoutEditor } from './WorkoutEditor';
import { alertRestDone, keepScreenOn } from '../device';
import { useNow } from '../useNow';
import { clock } from '../time';

export function WorkoutTab({ store }: { store: Store }) {
  return store.active ? <ActiveWorkout store={store} /> : <NextWorkout store={store} />;
}

function NextWorkout({ store }: { store: Store }) {
  const suggested = nextWorkoutType(store.history);
  const [type, setType] = useState<WorkoutType>(suggested);
  return (
    <>
      <h1>Next workout</h1>
      <div class="segmented">
        {(['A', 'B'] as WorkoutType[]).map((t) => (
          <button key={t} class={type === t ? 'on' : ''} onClick={() => setType(t)}>
            Workout {t}
            {t === suggested && <small> · up next</small>}
          </button>
        ))}
      </div>
      <div class="card preview">
        {WORKOUTS[type].map((lift) => {
          const n = nextWeight(lift, store.history, store.settings);
          return (
            <div class="row" key={lift}>
              <span>{LIFTS[lift].name}</span>
              <span class="muted">
                {LIFTS[lift].sets}×{LIFTS[lift].reps}
              </span>
              <strong>
                {fmtKg(n.weight)} kg
                {n.reason === 'deload' && <em class="tag">deload</em>}
                {n.reason === 'repeat' && <em class="tag">retry</em>}
              </strong>
            </div>
          );
        })}
      </div>
      <p class="muted center small">Estimated duration ≈ {Math.round(estimateWorkoutSec(type, store.history, store.settings) / 60)} min, including warm-up. See Guide.</p>
      <button class="primary big" onClick={() => store.start(type)}>
        Start Workout {type}
      </button>
      {store.history.length === 0 && (
        <p class="muted center">
          First time? Set your starting weights in Settings before you start.
        </p>
      )}
    </>
  );
}

function ActiveWorkout({ store }: { store: Store }) {
  const w = store.active!;
  const now = useNow();
  useEffect(() => keepScreenOn(), []);

  const finish = () => {
    const pending = w.entries.some((e) => e.sets.some((s) => s === null));
    if (pending && !confirm('Some sets are not marked. Finish anyway? Unmarked sets count as failed.')) return;
    store.finishActive();
  };
  const cancel = () => confirm('Discard this workout?') && store.cancelActive();

  return (
    <>
      <div class="title-row">
        <h1>Workout {w.type}</h1>
        <span class="muted">{clock((now - w.startedAt) / 1000)}</span>
      </div>
      <WorkoutEditor workout={w} settings={store.settings} history={store.history} live onChange={store.updateActive} />
      <div class="actions">
        <button class="danger" onClick={cancel}>
          Discard
        </button>
        <button class="primary" onClick={finish}>
          Finish workout
        </button>
      </div>
      {w.rest && <RestTimer now={now} rest={w.rest} onSkip={() => store.updateActive({ ...w, rest: undefined })} />}
    </>
  );
}

function RestTimer({ now, rest, onSkip }: { now: number; rest: Rest; onSkip(): void }) {
  const elapsed = (now - rest.startedAt) / 1000;
  const total = rest.extendedSec ?? rest.durationSec;
  const ready = elapsed >= rest.durationSec;
  const over = elapsed >= total;
  const alerted = useRef<string | undefined>(undefined);
  useEffect(() => {
    const stage = over ? 'over' : ready ? 'ready' : undefined;
    const key = `${rest.startedAt}:${stage}`;
    if (stage && alerted.current !== key) {
      alerted.current = key;
      const since = elapsed - (stage === 'over' ? total : rest.durationSec);
      if (since < 5) alertRestDone();
    }
  }, [ready, over, rest.startedAt]);

  let time: string;
  let label: string;
  if (!ready) {
    time = clock(rest.durationSec - elapsed);
    label = rest.extendedSec ? `Rest ${clock(rest.durationSec)} · up to ${clock(rest.extendedSec)} if it was hard` : `Failed set · rest ${clock(rest.durationSec)}`;
  } else if (!over) {
    time = 'Go';
    label = `Next set. If the last one was hard: ${clock(total - elapsed)} more`;
  } else {
    time = `+${clock(elapsed - total)}`;
    label = 'Rest done, next set';
  }

  return (
    <div class={`rest ${ready ? 'over' : ''}`}>
      <div>
        <div class="rest-time">{time}</div>
        <div class="rest-label">{label}</div>
      </div>
      <div class="rest-bar">
        <div style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
      </div>
      <button onClick={onSkip}>{ready ? 'Dismiss' : 'Skip'}</button>
    </div>
  );
}
