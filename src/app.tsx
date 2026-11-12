import { useEffect, useState } from 'preact/hooks';
import * as db from './db';
import { Settings, Workout, WorkoutType, createWorkout } from './program';
import { Backup } from './backup';
import { WorkoutTab } from './components/WorkoutTab';
import { HistoryTab } from './components/HistoryTab';
import { ProgressTab } from './components/ProgressTab';
import { SettingsTab } from './components/SettingsTab';
import { GuideTab } from './components/GuideTab';

type Tab = 'workout' | 'history' | 'progress' | 'guide' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'workout', label: 'Entrenar' },
  { id: 'history', label: 'Historial' },
  { id: 'progress', label: 'Progreso' },
  { id: 'guide', label: 'Guía' },
  { id: 'settings', label: 'Ajustes' },
];

export interface Store {
  history: Workout[];
  settings: Settings;
  active?: Workout;
  start(type: WorkoutType): void;
  updateActive(w: Workout): void;
  finishActive(): void;
  cancelActive(): void;
  saveWorkout(w: Workout): void;
  removeWorkout(id: string): void;
  updateSettings(s: Settings): void;
  restore(b: Backup): Promise<void>;
}

export function App() {
  const [tab, setTab] = useState<Tab>('workout');
  const [loaded, setLoaded] = useState(false);
  const [history, setHistory] = useState<Workout[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [active, setActive] = useState<Workout>();

  async function reload() {
    const [h, s, a] = await Promise.all([db.loadWorkouts(), db.loadSettings(), db.loadActive()]);
    setHistory(h);
    setSettings(s);
    setActive(a);
    setLoaded(true);
  }

  useEffect(() => {
    reload();
  }, []);

  if (!loaded || !settings) return <div class="loading">Cargando…</div>;

  const sortNewest = (ws: Workout[]) => [...ws].sort((a, b) => b.startedAt - a.startedAt);

  const store: Store = {
    history,
    settings,
    active,
    start(type) {
      const w = createWorkout(type, history, settings, crypto.randomUUID(), Date.now());
      setActive(w);
      db.saveActive(w);
    },
    updateActive(w) {
      setActive(w);
      db.saveActive(w);
    },
    finishActive() {
      if (!active) return;
      const { rest: _rest, ...done } = active;
      const w: Workout = { ...done, finishedAt: Date.now() };
      setHistory(sortNewest([w, ...history]));
      setActive(undefined);
      db.putWorkout(w);
      db.saveActive(undefined);
    },
    cancelActive() {
      setActive(undefined);
      db.saveActive(undefined);
    },
    saveWorkout(w) {
      setHistory(sortNewest(history.map((h) => (h.id === w.id ? w : h))));
      db.putWorkout(w);
    },
    removeWorkout(id) {
      setHistory(history.filter((h) => h.id !== id));
      db.deleteWorkout(id);
    },
    updateSettings(s) {
      setSettings(s);
      db.saveSettings(s);
    },
    async restore(b) {
      await db.replaceAll(b.settings, b.workouts, b.active);
      await reload();
    },
  };

  return (
    <>
      <main>
        {tab === 'workout' && <WorkoutTab store={store} />}
        {tab === 'history' && <HistoryTab store={store} />}
        {tab === 'progress' && <ProgressTab store={store} />}
        {tab === 'guide' && <GuideTab store={store} />}
        {tab === 'settings' && <SettingsTab store={store} />}
      </main>
      <nav class="tabs">
        {TABS.map((t) => (
          <button key={t.id} class={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'workout' && active && <span class="dot" />}
          </button>
        ))}
      </nav>
    </>
  );
}
