export type LiftId = 'squat' | 'bench' | 'row' | 'ohp' | 'deadlift';
export type WorkoutType = 'A' | 'B';

export const LIFTS: Record<LiftId, { name: string; sets: number; reps: number }> = {
  squat: { name: 'Squat', sets: 5, reps: 5 },
  bench: { name: 'Bench Press', sets: 5, reps: 5 },
  row: { name: 'Barbell Row', sets: 5, reps: 5 },
  ohp: { name: 'Overhead Press', sets: 5, reps: 5 },
  deadlift: { name: 'Deadlift', sets: 1, reps: 5 },
};

export const LIFT_IDS = Object.keys(LIFTS) as LiftId[];

export const WORKOUTS: Record<WorkoutType, LiftId[]> = {
  A: ['squat', 'bench', 'row'],
  B: ['squat', 'ohp', 'deadlift'],
};

export interface LiftEntry {
  lift: LiftId;
  weight: number;
  reps: number;
  sets: (number | null)[];
}

export interface Rest {
  startedAt: number;
  durationSec: number;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  startedAt: number;
  finishedAt?: number;
  entries: LiftEntry[];
  bodyweight?: number;
  notes?: string;
  rest?: Rest;
}

export interface Settings {
  startWeights: Record<LiftId, number>;
  increments: Record<LiftId, number>;
  barWeight: number;
  plates: number[];
  restSuccessSec: number;
  restFailSec: number;
  deloadPercent: number;
  failuresBeforeDeload: number;
  lastExportAt?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  startWeights: { squat: 20, bench: 20, row: 30, ohp: 20, deadlift: 40 },
  increments: { squat: 2.5, bench: 2.5, row: 2.5, ohp: 2.5, deadlift: 5 },
  barWeight: 20,
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
  restSuccessSec: 180,
  restFailSec: 300,
  deloadPercent: 10,
  failuresBeforeDeload: 3,
};

export const isSkipped = (e: LiftEntry) => e.sets.every((s) => s === null);
export const isSuccess = (e: LiftEntry) => e.sets.every((s) => s !== null && s >= e.reps);

export type Reason = 'start' | 'increase' | 'repeat' | 'deload';

export interface NextWeight {
  weight: number;
  reason: Reason;
  failures: number;
}

const roundDown = (w: number, step = 2.5) => Math.floor(w / step + 1e-9) * step;

function liftHistory(lift: LiftId, finishedNewestFirst: Workout[]): LiftEntry[] {
  return finishedNewestFirst.flatMap((w) => w.entries.filter((e) => e.lift === lift && !isSkipped(e)));
}

export function nextWeight(lift: LiftId, finishedNewestFirst: Workout[], settings: Settings): NextWeight {
  const sessions = liftHistory(lift, finishedNewestFirst);
  if (sessions.length === 0) return { weight: settings.startWeights[lift], reason: 'start', failures: 0 };

  const last = sessions[0];
  if (isSuccess(last)) return { weight: last.weight + settings.increments[lift], reason: 'increase', failures: 0 };

  let failures = 0;
  for (const s of sessions) {
    if (s.weight !== last.weight || isSuccess(s)) break;
    failures++;
  }
  if (failures >= settings.failuresBeforeDeload) {
    const deloaded = Math.max(settings.barWeight, roundDown(last.weight * (1 - settings.deloadPercent / 100)));
    return { weight: deloaded, reason: 'deload', failures };
  }
  return { weight: last.weight, reason: 'repeat', failures };
}

export function nextWorkoutType(finishedNewestFirst: Workout[]): WorkoutType {
  return finishedNewestFirst[0]?.type === 'A' ? 'B' : 'A';
}

export function createWorkout(type: WorkoutType, finishedNewestFirst: Workout[], settings: Settings, id: string, now: number): Workout {
  return {
    id,
    type,
    startedAt: now,
    entries: WORKOUTS[type].map((lift) => ({
      lift,
      weight: nextWeight(lift, finishedNewestFirst, settings).weight,
      reps: LIFTS[lift].reps,
      sets: Array(LIFTS[lift].sets).fill(null),
    })),
  };
}

export function tapSet(current: number | null, target: number): number | null {
  if (current === null) return target;
  if (current === 0) return null;
  return current - 1;
}

export interface WarmupSet {
  weight: number;
  reps: number;
}

export function warmups(lift: LiftId, weight: number, bar: number): WarmupSet[] {
  if (weight <= bar) return [];
  const steps: WarmupSet[] = lift === 'deadlift' ? [] : [{ weight: bar, reps: 5 }, { weight: bar, reps: 5 }];
  const ramps: [number, number][] = lift === 'deadlift' ? [[0.4, 5], [0.6, 3], [0.8, 2]] : [[0.55, 5], [0.7, 3], [0.85, 2]];
  for (const [pct, reps] of ramps) {
    const w = roundDown(weight * pct);
    const prev = steps[steps.length - 1]?.weight ?? 0;
    if (w >= bar && w > prev && w < weight) steps.push({ weight: w, reps });
  }
  return steps;
}

export function platesPerSide(weight: number, bar: number, plates: number[]): { plates: number[]; remainder: number } {
  let side = (weight - bar) / 2;
  if (side <= 0) return { plates: [], remainder: 0 };
  const out: number[] = [];
  for (const p of [...plates].sort((a, b) => b - a)) {
    while (side + 1e-9 >= p) {
      out.push(p);
      side -= p;
    }
  }
  return { plates: out, remainder: Math.round(side * 1000) / 1000 };
}

export const fmtKg = (w: number) => `${Number.isInteger(w) ? w : w.toFixed(w * 10 === Math.round(w * 10) ? 1 : 2)}`;
