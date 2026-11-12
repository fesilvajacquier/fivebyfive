import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  LiftEntry,
  Workout,
  createWorkout,
  nextWeight,
  nextWorkoutType,
  platesPerSide,
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

  it('ramps warmups below the working weight', () => {
    expect(warmups('squat', 20, 20)).toEqual([]);
    expect(warmups('squat', 100, 20)).toEqual([
      { weight: 20, reps: 5 },
      { weight: 20, reps: 5 },
      { weight: 55, reps: 5 },
      { weight: 70, reps: 3 },
      { weight: 85, reps: 2 },
    ]);
    expect(warmups('deadlift', 100, 20)[0]).toEqual({ weight: 40, reps: 5 });
  });
});
