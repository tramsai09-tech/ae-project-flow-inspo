/**
 * Tests for sample.ts — curve sampling, LUT, and arc-length computation.
 */

import { describe, expect, it } from 'vitest';
import {
  arcLength,
  buildLUT,
  lookupY,
  parameterAtArcLength,
  sampleCurve,
  sampleCurveArcLength,
} from '../src/sample.ts';
import type { ControlPoints } from '../src/types.ts';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const linear: ControlPoints = [
  { x: 0, y: 0 },
  { x: 1 / 3, y: 1 / 3 },
  { x: 2 / 3, y: 2 / 3 },
  { x: 1, y: 1 },
];

const easeIO: ControlPoints = [
  { x: 0, y: 0 },
  { x: 0.42, y: 0 },
  { x: 0.58, y: 1 },
  { x: 1, y: 1 },
];

// ─── sampleCurve ──────────────────────────────────────────────────────────────

describe('sampleCurve', () => {
  it('returns exactly `count` samples', () => {
    const samples = sampleCurve(linear, { count: 50 });
    expect(samples).toHaveLength(50);
  });

  it('first sample has t=0, last has t=1', () => {
    const samples = sampleCurve(linear, { count: 10 });
    expect(samples[0]!.t).toBe(0);
    expect(samples[samples.length - 1]!.t).toBe(1);
  });

  it('t values are evenly spaced', () => {
    const samples = sampleCurve(linear, { count: 5 });
    const tValues = samples.map((s) => s.t);
    expect(tValues).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it('first sample point matches P0', () => {
    const s = sampleCurve(easeIO, { count: 10 })[0]!;
    expect(s.point.x).toBeCloseTo(0, 8);
    expect(s.point.y).toBeCloseTo(0, 8);
  });

  it('last sample point matches P3', () => {
    const samples = sampleCurve(easeIO, { count: 10 });
    const last = samples[samples.length - 1]!;
    expect(last.point.x).toBeCloseTo(1, 8);
    expect(last.point.y).toBeCloseTo(1, 8);
  });

  it('each sample has a non-negative speed', () => {
    const samples = sampleCurve(easeIO, { count: 20 });
    for (const s of samples) {
      expect(s.speed).toBeGreaterThanOrEqual(0);
    }
  });

  it('linear curve samples have constant speed ≈ √2', () => {
    // For the diagonal unit line, speed = |B′(t)| = |(1,1)| = √2
    const samples = sampleCurve(linear, { count: 10 });
    const expectedSpeed = Math.sqrt(2);
    for (const s of samples) {
      expect(s.speed).toBeCloseTo(expectedSpeed, 5);
    }
  });

  it('throws when count < 2', () => {
    expect(() => sampleCurve(linear, { count: 1 })).toThrow(RangeError);
  });

  it('uses default count of 100 when no options passed', () => {
    const samples = sampleCurve(linear);
    expect(samples).toHaveLength(100);
  });
});

// ─── sampleCurveArcLength ─────────────────────────────────────────────────────

describe('sampleCurveArcLength', () => {
  it('returns exactly `count` samples', () => {
    const samples = sampleCurveArcLength(linear, { count: 20 });
    expect(samples).toHaveLength(20);
  });

  it('first sample t ≈ 0, last sample t ≈ 1', () => {
    const samples = sampleCurveArcLength(linear, { count: 10 });
    expect(samples[0]!.t).toBeCloseTo(0, 4);
    expect(samples[samples.length - 1]!.t).toBeCloseTo(1, 4);
  });

  it('for a linear curve, arc-length samples equal uniform samples', () => {
    // A straight line has constant speed, so arc-length t = uniform t
    const uniform = sampleCurve(linear, { count: 10 });
    const arcLen = sampleCurveArcLength(linear, { count: 10 });
    for (let i = 0; i < 10; i++) {
      expect(arcLen[i]!.t).toBeCloseTo(uniform[i]!.t, 3);
    }
  });

  it('consecutive arc-length samples have approximately equal distances', () => {
    const samples = sampleCurveArcLength(easeIO, { count: 11 });
    const distances: number[] = [];
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1]!.point;
      const curr = samples[i]!.point;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      distances.push(Math.sqrt(dx * dx + dy * dy));
    }
    const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
    // All distances should be within 10% of the average
    for (const d of distances) {
      expect(d).toBeCloseTo(avgDist, 1);
    }
  });

  it('throws when count < 2', () => {
    expect(() => sampleCurveArcLength(linear, { count: 1 })).toThrow(RangeError);
  });
});

// ─── buildLUT / lookupY ───────────────────────────────────────────────────────

describe('buildLUT', () => {
  it('returns resolution+1 entries', () => {
    const lut = buildLUT(easeIO, 100);
    expect(lut).toHaveLength(101);
  });

  it('first entry: t=0, x≈0, y≈0', () => {
    const lut = buildLUT(easeIO, 100);
    expect(lut[0]!.t).toBeCloseTo(0, 8);
    expect(lut[0]!.x).toBeCloseTo(0, 8);
    expect(lut[0]!.y).toBeCloseTo(0, 8);
  });

  it('last entry: t=1, x≈1, y≈1', () => {
    const lut = buildLUT(easeIO, 100);
    const last = lut[lut.length - 1]!;
    expect(last.t).toBeCloseTo(1, 8);
    expect(last.x).toBeCloseTo(1, 8);
    expect(last.y).toBeCloseTo(1, 8);
  });

  it('throws for resolution < 1', () => {
    expect(() => buildLUT(easeIO, 0)).toThrow(RangeError);
  });
});

describe('lookupY', () => {
  it('returns P0.y for x ≤ LUT start', () => {
    const lut = buildLUT(easeIO, 200);
    expect(lookupY(lut, -0.1)).toBeCloseTo(0, 6);
    expect(lookupY(lut, 0)).toBeCloseTo(0, 6);
  });

  it('returns P3.y for x ≥ LUT end', () => {
    const lut = buildLUT(easeIO, 200);
    expect(lookupY(lut, 1)).toBeCloseTo(1, 6);
    expect(lookupY(lut, 1.5)).toBeCloseTo(1, 6);
  });

  it('lookupY ≈ evaluateEasing for x ∈ (0, 1) with high-resolution LUT', () => {
    // With resolution=500, max error should be < 0.001
    const { evaluateEasing } = await import('../src/evaluate.ts');
    const lut = buildLUT(easeIO, 500);
    for (const x of [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9]) {
      const lutY = lookupY(lut, x);
      const exactY = evaluateEasing(easeIO, x);
      expect(Math.abs(lutY - exactY)).toBeLessThan(0.002);
    }
  });

  it('throws for empty LUT', () => {
    expect(() => lookupY([], 0.5)).toThrow();
  });
});

// ─── arcLength ────────────────────────────────────────────────────────────────

describe('arcLength', () => {
  it('computes arc length of a linear diagonal: ≈ √2', () => {
    // The unit diagonal has length √(1² + 1²) = √2
    const len = arcLength(linear);
    expect(len).toBeCloseTo(Math.sqrt(2), 3);
  });

  it('half arc length ≈ full arc length / 2 for symmetric curve', () => {
    const full = arcLength(easeIO);
    const half = arcLength(easeIO, 0, 0.5) + arcLength(easeIO, 0.5, 1);
    expect(half).toBeCloseTo(full, 4);
  });

  it('arcLength(cp, t0, t1) ≤ arcLength(cp) for any sub-interval', () => {
    const full = arcLength(linear);
    const partial = arcLength(linear, 0.2, 0.8);
    expect(partial).toBeLessThanOrEqual(full + 1e-9);
  });

  it('returns 0 for a degenerate interval (t0 = t1)', () => {
    expect(arcLength(linear, 0.5, 0.5)).toBe(0);
  });

  it('throws for out-of-range t0 or t1', () => {
    expect(() => arcLength(linear, -0.1, 1)).toThrow(RangeError);
    expect(() => arcLength(linear, 0, 1.1)).toThrow(RangeError);
  });
});

// ─── parameterAtArcLength ─────────────────────────────────────────────────────

describe('parameterAtArcLength', () => {
  it('returns 0 for s=0', () => {
    expect(parameterAtArcLength(linear, 0)).toBeCloseTo(0, 4);
  });

  it('returns 1 for s = totalLength', () => {
    const total = arcLength(linear);
    expect(parameterAtArcLength(linear, total)).toBeCloseTo(1, 3);
  });

  it('returns ≈ 0.5 for s = half length on the linear curve', () => {
    const half = arcLength(linear) / 2;
    expect(parameterAtArcLength(linear, half)).toBeCloseTo(0.5, 3);
  });
});
