import { useEffect, useRef, useState } from 'preact/hooks';
import type { Store } from '../app';
import { LIFTS, WORKOUTS, WorkoutType, fmtKg, nextWeight, nextWorkoutType } from '../program';
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

function RestTimer({ now, rest, onSkip }: { now: number; rest: { startedAt: number; durationSec: number }; onSkip(): void }) {
  const elapsed = (now - rest.startedAt) / 1000;
  const over = elapsed >= rest.durationSec;
  const alerted = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (over && alerted.current !== rest.startedAt) {
      alerted.current = rest.startedAt;
      if (elapsed - rest.durationSec < 5) alertRestDone();
    }
  }, [over, rest.startedAt]);

  return (
    <div class={`rest ${over ? 'over' : ''}`}>
      <div>
        <div class="rest-time">{over ? `+${clock(elapsed - rest.durationSec)}` : clock(rest.durationSec - elapsed)}</div>
        <div class="rest-label">{over ? 'Rest done, next set' : `Rest · ${clock(rest.durationSec)}`}</div>
      </div>
      <div class="rest-bar">
        <div style={{ width: `${Math.min(100, (elapsed / rest.durationSec) * 100)}%` }} />
      </div>
      <button onClick={onSkip}>{over ? 'Dismiss' : 'Skip'}</button>
    </div>
  );
}
