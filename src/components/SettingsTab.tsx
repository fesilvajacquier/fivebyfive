import { useEffect, useRef, useState } from 'preact/hooks';
import type { Store } from '../app';
import { DEFAULT_SETTINGS, LIFTS, LIFT_IDS, LiftId, Settings } from '../program';
import { backupFile, canShareFile, downloadFile, parseBackup, shareFile } from '../backup';
import { daysAgo } from '../time';
import { NumberInput } from './WorkoutEditor';

export function SettingsTab({ store }: { store: Store }) {
  const s = store.settings;
  const set = (patch: Partial<Settings>) => store.updateSettings({ ...s, ...patch });
  const setLift = (key: 'startWeights' | 'increments', lift: LiftId, v?: number) =>
    v !== undefined && set({ [key]: { ...s[key], [lift]: v } });
  const fileInput = useRef<HTMLInputElement>(null);
  const [persisted, setPersisted] = useState<boolean>();

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted);
  }, []);

  const exportNow = async (share: boolean) => {
    const exportedAt = Date.now();
    const file = backupFile({ app: 'fivebyfive', version: 1, exportedAt, settings: { ...s, lastExportAt: exportedAt }, workouts: store.history, active: store.active });
    try {
      if (share) await shareFile(file);
      else downloadFile(file);
      set({ lastExportAt: exportedAt });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') alert(`No se pudo exportar: ${(e as Error).message}`);
    }
  };

  const importFile = async (f?: File) => {
    if (!f) return;
    try {
      const b = await parseBackup(f);
      if (!confirm(`¿Reemplazar TODOS los datos actuales por este respaldo (${b.workouts.length} entrenamientos)?`)) return;
      await store.restore(b);
      alert('Respaldo restaurado.');
    } catch (e) {
      alert(`No se pudo importar: ${(e as Error).message}`);
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const shareSupported = canShareFile(new File(['{}'], 'x.json', { type: 'application/json' }));

  return (
    <>
      <h1>Ajustes</h1>

      <section class="card">
        <h2>Respaldo</h2>
        <p class="muted small">
          Los datos viven solo en este dispositivo. Exportá seguido y guardá el archivo en Google Drive.
          <br />
          Último respaldo: <strong>{s.lastExportAt ? daysAgo(s.lastExportAt) : 'nunca'}</strong>
          {persisted === false && <> · el navegador podría borrar los datos; instalá la app en la pantalla de inicio.</>}
        </p>
        <div class="actions">
          {shareSupported && (
            <button class="primary" onClick={() => exportNow(true)}>
              Compartir a Drive…
            </button>
          )}
          <button onClick={() => exportNow(false)}>Descargar</button>
          <button onClick={() => fileInput.current?.click()}>Importar…</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => importFile((e.target as HTMLInputElement).files?.[0])} />
        </div>
      </section>

      <section class="card">
        <h2>Pesos iniciales (kg)</h2>
        <p class="muted small">Se usan solo en la primera sesión de cada ejercicio. Después, el peso sale de tu historial.</p>
        <div class="grid">
          {LIFT_IDS.map((l) => (
            <label key={l}>
              {LIFTS[l].name}
              <NumberInput value={s.startWeights[l]} onChange={(v) => setLift('startWeights', l, v)} />
            </label>
          ))}
        </div>
      </section>

      <section class="card">
        <h2>Aumento por sesión lograda (kg)</h2>
        <div class="grid">
          {LIFT_IDS.map((l) => (
            <label key={l}>
              {LIFTS[l].name}
              <NumberInput value={s.increments[l]} onChange={(v) => setLift('increments', l, v)} />
            </label>
          ))}
        </div>
      </section>

      <section class="card">
        <h2>Descanso y descarga</h2>
        <div class="grid">
          <label>
            Descanso tras serie lograda (s)
            <NumberInput value={s.restSuccessSec} onChange={(v) => v && set({ restSuccessSec: v })} />
          </label>
          <label>
            …hasta, si costó (s)
            <NumberInput value={s.restHardSec} onChange={(v) => v && set({ restHardSec: v })} />
          </label>
          <label>
            Descanso tras serie fallida (s)
            <NumberInput value={s.restFailSec} onChange={(v) => v && set({ restFailSec: v })} />
          </label>
          <label>
            Fallos antes de descargar
            <NumberInput value={s.failuresBeforeDeload} onChange={(v) => v && set({ failuresBeforeDeload: v })} />
          </label>
          <label>
            Descarga (%)
            <NumberInput value={s.deloadPercent} onChange={(v) => v !== undefined && set({ deloadPercent: v })} />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Equipo</h2>
        <div class="grid">
          <label>
            Peso de la barra (kg)
            <NumberInput value={s.barWeight} onChange={(v) => v !== undefined && set({ barWeight: v })} />
          </label>
          <label>
            Discos (kg, separados por coma)
            <PlatesInput plates={s.plates} onChange={(plates) => set({ plates })} />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Zona peligrosa</h2>
        <div class="actions">
          <button onClick={() => confirm('¿Volver a los ajustes por defecto?') && store.updateSettings({ ...DEFAULT_SETTINGS, lastExportAt: s.lastExportAt })}>
            Restablecer ajustes
          </button>
          <button
            class="danger"
            onClick={() =>
              prompt('Esto borra todos los entrenamientos. Escribí BORRAR para confirmar.') === 'BORRAR' &&
              store.restore({ app: 'fivebyfive', version: 1, exportedAt: Date.now(), settings: s, workouts: [] })
            }
          >
            Borrar todos los entrenamientos
          </button>
        </div>
      </section>
      <p class="muted center small">Five by Five · datos guardados en el dispositivo (IndexedDB)</p>
    </>
  );
}

function PlatesInput({ plates, onChange }: { plates: number[]; onChange(p: number[]): void }) {
  const [text, setText] = useState(plates.join(', '));
  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onInput={(e) => setText((e.target as HTMLInputElement).value)}
      onBlur={() => {
        const p = text
          .split(/[\s;]+|,\s+/)
          .map((x) => parseFloat(x.replace(',', '.')))
          .filter((x) => x > 0);
        if (p.length) onChange(p);
        setText((p.length ? p : plates).join(', '));
      }}
    />
  );
}
