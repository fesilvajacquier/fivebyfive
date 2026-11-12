import { useState } from 'preact/hooks';
import type { Store } from '../app';
import { LIFTS, fmtKg, isSkipped, isSuccess } from '../program';
import { clock, fmtDate } from '../time';
import { WorkoutEditor } from './WorkoutEditor';

export function HistoryTab({ store }: { store: Store }) {
  const [openId, setOpenId] = useState<string>();
  const open = store.history.find((w) => w.id === openId);

  if (open) {
    const older = store.history.filter((w) => w.startedAt < open.startedAt);
    return (
      <>
        <div class="title-row">
          <button class="link" onClick={() => setOpenId(undefined)}>
            ‹ Historial
          </button>
        </div>
        <h1>Workout {open.type}</h1>
        <p class="muted">
          {fmtDate(open.startedAt)}
          {open.finishedAt && ` · ${clock((open.finishedAt - open.startedAt) / 1000)}`}
        </p>
        <WorkoutEditor workout={open} settings={store.settings} history={older} live={false} onChange={store.saveWorkout} />
        <div class="actions">
          <button
            class="danger"
            onClick={() => {
              if (!confirm('¿Borrar este entrenamiento?')) return;
              store.removeWorkout(open.id);
              setOpenId(undefined);
            }}
          >
            Borrar entrenamiento
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Historial</h1>
      {store.history.length === 0 && <p class="muted">Todavía no hay entrenamientos.</p>}
      {store.history.map((w) => (
        <button key={w.id} class="card history-item" onClick={() => setOpenId(w.id)}>
          <div class="title-row">
            <strong>Workout {w.type}</strong>
            <span class="muted">{fmtDate(w.startedAt)}</span>
          </div>
          {w.entries.map((e) => (
            <div class="row" key={e.lift}>
              <span>{LIFTS[e.lift].name}</span>
              <span class={isSkipped(e) ? 'muted' : isSuccess(e) ? 'ok-text' : 'fail-text'}>
                {isSkipped(e) ? 'salteado' : e.sets.map((s) => s ?? '–').join('/')}
              </span>
              <strong>{fmtKg(e.weight)} kg</strong>
            </div>
          ))}
        </button>
      ))}
    </>
  );
}
