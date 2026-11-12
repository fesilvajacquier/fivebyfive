import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  LiftEntry,
  Workout,
  createWorkout,
  nextWeight,
  nextWorkoutType,
  estimateWorkoutSec,
  platesPerSide,
  restAfterSet,
  tapSet,
  warmups,
} from './program';

const S = DEFAULT_SETTINGS;
let t = 0;
const squat = (weight: number, sets: (number | null)[]): Workout => ({
  id: String(++t),
  type: 'A',
  startedAt: t,
  finishedAt: t,
  entries: [{ lift: 'squat', weight, reps: 5, sets } as LiftEntry],
});
const newestFirst = (...ws: Workout[]) => [...ws].reverse();
const ok = [5, 5, 5, 5, 5];
const fail = [5, 5, 5, 4, 3];

describe('nextWeight', () => {
  it('uses the start weight with no history', () => {
    expect(nextWeight('row', [], S)).toEqual({ weight: 30, reason: 'start', failures: 0 });
  });

  it('adds the increment after a successful session', () => {
    expect(nextWeight('squat', newestFirst(squat(60, ok)), S).weight).toBe(62.5);
  });

  it('repeats the weight after a failure', () => {
    expect(nextWeight('squat', newestFirst(squat(60, ok), squat(62.5, fail)), S)).toEqual({ weight: 62.5, reason: 'repeat', failures: 1 });
  });

  it('deloads 10% rounded down to 2.5 after three failures at the same weight', () => {
    const h = newestFirst(squat(100, fail), squat(100, fail), squat(100, fail));
    expect(nextWeight('squat', h, S)).toEqual({ weight: 90, reason: 'deload', failures: 3 });
    const h2 = newestFirst(squat(62.5, fail), squat(62.5, fail), squat(62.5, fail));
    expect(nextWeight('squat', h2, S).weight).toBe(55);
  });

  it('resets the failure count after a deload', () => {
    const h = newestFirst(squat(100, fail), squat(100, fail), squat(100, fail), squat(90, fail));
    expect(nextWeight('squat', h, S)).toEqual({ weight: 90, reason: 'repeat', failures: 1 });
  });

  it('treats unfinished sets as a failure but ignores fully skipped lifts', () => {
    expect(nextWeight('squat', newestFirst(squat(60, [5, 5, 5, null, null])), S).reason).toBe('repeat');
    expect(nextWeight('squat', newestFirst(squat(60, ok), squat(62.5, [null, null, null, null, null])), S).weight).toBe(62.5);
  });

  it('never deloads below the bar', () => {
    const h = newestFirst(squat(20, fail), squat(20, fail), squat(20, fail));
    expect(nextWeight('squat', h, S).weight).toBe(20);
  });
});

describe('workouts', () => {
  it('alternates A and B', () => {
    expect(nextWorkoutType([])).toBe('A');
    expect(nextWorkoutType([{ ...squat(20, ok), type: 'A' }])).toBe('B');
    expect(nextWorkoutType([{ ...squat(20, ok), type: 'B' }])).toBe('A');
  });

  it('builds 5x5 entries and a 1x5 deadlift', () => {
    const w = createWorkout('B', [], S, 'x', 0);
    expect(w.entries.map((e) => [e.lift, e.weight, e.sets.length])).toEqual([
      ['squat', 20, 5],
      ['ohp', 20, 5],
      ['deadlift', 40, 1],
    ]);
  });
});

describe('tapSet', () => {
  it('cycles empty → target → down to 0 → empty', () => {
    const seq: (number | null)[] = [null];
    for (let i = 0; i < 7; i++) seq.push(tapSet(seq[seq.length - 1], 5));
    expect(seq).toEqual([null, 5, 4, 3, 2, 1, 0, null]);
  });
});

describe('plates and warmups', () => {
  it('computes plates per side', () => {
    expect(platesPerSide(102.5, 20, S.plates)).toEqual({ plates: [25, 15, 1.25], remainder: 0 });
    expect(platesPerSide(20, 20, S.plates).plates).toEqual([]);
    expect(platesPerSide(21, 20, S.plates).remainder).toBe(0.5);
  });

  it('follows the StrongLifts warm-up: 2x5 empty bar, then jumps of at most 20 kg', () => {
    expect(warmups('squat', 20, 20)).toEqual([]);
    expect(warmups('squat', 70, 20).map((w) => w.weight)).toEqual([20, 20, 35, 52.5]);
    expect(warmups('bench', 50, 20).map((w) => w.weight)).toEqual([20, 20, 35]);
    expect(warmups('squat', 30, 20).map((w) => w.weight)).toEqual([20, 20]);
    expect(warmups('squat', 70, 20).every((w) => w.reps === 5)).toBe(true);
  });

  it('starts row and deadlift warm-ups from a floor weight instead of the empty bar', () => {
    expect(warmups('row', 30, 20)).toEqual([]);
    expect(warmups('row', 40, 20).map((w) => w.weight)).toEqual([30]);
    expect(warmups('deadlift', 80, 20).map((w) => w.weight)).toEqual([40, 60]);
  });
});

describe('rest and duration', () => {
  const entry = (sets: (number | null)[]): LiftEntry => ({ lift: 'squat', weight: 60, reps: 5, sets });

  it('rests 2 min (3 if hard) after a good set, 5 min after a failed one, none after the last set', () => {
    expect(restAfterSet(entry([5, null, null, null, null]), 5, S, 0)).toEqual({ startedAt: 0, durationSec: 120, extendedSec: 180 });
    expect(restAfterSet(entry([3, null, null, null, null]), 3, S, 0)).toEqual({ startedAt: 0, durationSec: 300 });
    expect(restAfterSet(entry([5, 5, 5, 5, 5]), 5, S, 0)).toBeUndefined();
  });

  it('estimates workout A at about 42 min for squat 70 / bench 50 / row 40', () => {
    const settings = { ...S, startWeights: { ...S.startWeights, squat: 70, bench: 50, row: 40 } };
    expect(Math.round(estimateWorkoutSec('A', [], settings) / 60)).toBe(43);
  });
});
