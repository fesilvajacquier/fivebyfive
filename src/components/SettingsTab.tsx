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
      if ((e as Error).name !== 'AbortError') alert(`Export failed: ${(e as Error).message}`);
    }
  };

  const importFile = async (f?: File) => {
    if (!f) return;
    try {
      const b = await parseBackup(f);
      if (!confirm(`Replace ALL current data with this backup (${b.workouts.length} workouts)?`)) return;
      await store.restore(b);
      alert('Backup restored.');
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const shareSupported = canShareFile(new File(['{}'], 'x.json', { type: 'application/json' }));

  return (
    <>
      <h1>Settings</h1>

      <section class="card">
        <h2>Backup</h2>
        <p class="muted small">
          Data lives only in this browser. Export regularly and save the file to Google Drive.
          <br />
          Last backup: <strong>{s.lastExportAt ? daysAgo(s.lastExportAt) : 'never'}</strong>
          {persisted === false && <> · storage may be cleared by the browser; install the app to your home screen.</>}
        </p>
        <div class="actions">
          {shareSupported && (
            <button class="primary" onClick={() => exportNow(true)}>
              Share to Drive…
            </button>
          )}
          <button onClick={() => exportNow(false)}>Download</button>
          <button onClick={() => fileInput.current?.click()}>Import…</button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => importFile((e.target as HTMLInputElement).files?.[0])} />
        </div>
      </section>

      <section class="card">
        <h2>Starting weights (kg)</h2>
        <p class="muted small">Used only for a lift's first session. After that, weights come from your history.</p>
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
        <h2>Increment per success (kg)</h2>
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
        <h2>Rest & deload</h2>
        <div class="grid">
          <label>
            Rest after success (sec)
            <NumberInput value={s.restSuccessSec} onChange={(v) => v && set({ restSuccessSec: v })} />
          </label>
          <label>
            Rest after failed set (sec)
            <NumberInput value={s.restFailSec} onChange={(v) => v && set({ restFailSec: v })} />
          </label>
          <label>
            Failures before deload
            <NumberInput value={s.failuresBeforeDeload} onChange={(v) => v && set({ failuresBeforeDeload: v })} />
          </label>
          <label>
            Deload (%)
            <NumberInput value={s.deloadPercent} onChange={(v) => v !== undefined && set({ deloadPercent: v })} />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Equipment</h2>
        <div class="grid">
          <label>
            Bar weight (kg)
            <NumberInput value={s.barWeight} onChange={(v) => v !== undefined && set({ barWeight: v })} />
          </label>
          <label>
            Plates (kg, comma-separated)
            <PlatesInput plates={s.plates} onChange={(plates) => set({ plates })} />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Danger zone</h2>
        <div class="actions">
          <button onClick={() => confirm('Reset settings to defaults?') && store.updateSettings({ ...DEFAULT_SETTINGS, lastExportAt: s.lastExportAt })}>
            Reset settings
          </button>
          <button
            class="danger"
            onClick={() =>
              prompt('This deletes every workout. Type DELETE to confirm.') === 'DELETE' &&
              store.restore({ app: 'fivebyfive', version: 1, exportedAt: Date.now(), settings: s, workouts: [] })
            }
          >
            Erase all workouts
          </button>
        </div>
      </section>
      <p class="muted center small">Five by Five · data stored locally with IndexedDB</p>
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
