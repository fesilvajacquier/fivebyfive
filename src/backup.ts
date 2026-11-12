import { DEFAULT_SETTINGS, Settings, Workout } from './program';

export interface Backup {
  app: 'fivebyfive';
  version: 1;
  exportedAt: number;
  settings: Settings;
  workouts: Workout[];
  active?: Workout;
}

export function backupFile(b: Backup): File {
  const day = new Date(b.exportedAt).toISOString().slice(0, 10);
  return new File([JSON.stringify(b, null, 2)], `fivebyfive-${day}.json`, { type: 'application/json' });
}

export function canShareFile(f: File) {
  return typeof navigator.canShare === 'function' && navigator.canShare({ files: [f] });
}

export async function shareFile(f: File) {
  await navigator.share({ files: [f], title: f.name });
}

export function downloadFile(f: File) {
  const url = URL.createObjectURL(f);
  const a = Object.assign(document.createElement('a'), { href: url, download: f.name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function parseBackup(f: File): Promise<Backup> {
  const data = JSON.parse(await f.text());
  if (data?.app !== 'fivebyfive' || !Array.isArray(data.workouts)) throw new Error('Not a fivebyfive backup file');
  return { ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } };
}
