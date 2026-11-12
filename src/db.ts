import { openDB } from 'idb';
import { DEFAULT_SETTINGS, Settings, Workout } from './program';

const dbp = openDB('fivebyfive', 1, {
  upgrade(db) {
    db.createObjectStore('workouts', { keyPath: 'id' });
    db.createObjectStore('kv');
  },
});

export async function loadWorkouts(): Promise<Workout[]> {
  const all: Workout[] = await (await dbp).getAll('workouts');
  return all.sort((a, b) => b.startedAt - a.startedAt);
}

export const putWorkout = async (w: Workout) => (await dbp).put('workouts', w);
export const deleteWorkout = async (id: string) => (await dbp).delete('workouts', id);

export async function loadSettings(): Promise<Settings> {
  const stored: Partial<Settings> | undefined = await (await dbp).get('kv', 'settings');
  const migrated = stored && !stored.version && stored.restSuccessSec === 180 ? { restSuccessSec: 120 } : {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    ...migrated,
    version: 2,
    startWeights: { ...DEFAULT_SETTINGS.startWeights, ...stored?.startWeights },
    increments: { ...DEFAULT_SETTINGS.increments, ...stored?.increments },
  };
}

export const saveSettings = async (s: Settings) => (await dbp).put('kv', s, 'settings');
export const loadActive = async (): Promise<Workout | undefined> => (await dbp).get('kv', 'active');
export const saveActive = async (w: Workout | undefined) =>
  w ? (await dbp).put('kv', w, 'active') : (await dbp).delete('kv', 'active');

export async function replaceAll(settings: Settings, workouts: Workout[], active?: Workout) {
  const db = await dbp;
  const tx = db.transaction(['workouts', 'kv'], 'readwrite');
  const ws = tx.objectStore('workouts');
  const kv = tx.objectStore('kv');
  await ws.clear();
  await kv.clear();
  for (const w of workouts) await ws.put(w);
  await kv.put(settings, 'settings');
  if (active) await kv.put(active, 'active');
  await tx.done;
}
