/**
 * Tests for acceleration.ts — acceleration vectors, curvature, normal vector.
 */

import { describe, expect, it } from 'vitest';
import {
  accelerationAtT,
  accelerationCurve,
  accelerationMagnitudeAtT,
  curvatureAtT,
  normalAtT,
  radiusOfCurvatureAtT,
} from '../src/acceleration.ts';
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

// A curve that clearly overshoots — useful for curvature sign testing
// P1 pushes hard to the left (negative curvature), P2 hard to the right
const sCurve: ControlPoints = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
];

const degenerate: ControlPoints = [
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.5 },
];

// ─── accelerationAtT ──────────────────────────────────────────────────────────

describe('accelerationAtT', () => {
  it('linear curve: zero acceleration everywhere', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const a = accelerationAtT(linear, t);
      expect(a.x).toBeCloseTo(0, 6);
      expect(a.y).toBeCloseTo(0, 6);
    }
  });

  it('equals evaluateSecondDerivative output', () => {
    const { evaluateSecondDerivative } = await import('../src/evaluate.ts');
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const a = accelerationAtT(easeIO, t);
      const d2 = evaluateSecondDerivative(easeIO, t);
      expect(a.x).toBeCloseTo(d2.x, 10);
      expect(a.y).toBeCloseTo(d2.y, 10);
    }
  });

  it('ease-in-out: acceleration is (0, 0) at t=0.5 (inflection point)', () => {
    const a = accelerationAtT(easeIO, 0.5);
    expect(a.x).toBeCloseTo(0, 5);
    expect(a.y).toBeCloseTo(0, 5);
  });
});

// ─── accelerationMagnitudeAtT ─────────────────────────────────────────────────

describe('accelerationMagnitudeAtT', () => {
  it('linear curve: zero magnitude everywhere', () => {
    for (const t of [0, 0.5, 1]) {
      expect(accelerationMagnitudeAtT(linear, t)).toBeCloseTo(0, 6);
    }
  });

  it('always returns a non-negative value', () => {
    for (const t of [0, 0.1, 0.5, 0.9, 1]) {
      expect(accelerationMagnitudeAtT(easeIO, t)).toBeGreaterThanOrEqual(0);
    }
  });

  it('equals magnitude of accelerationAtT', () => {
    for (const t of [0, 0.33, 0.67, 1]) {
      const a = accelerationAtT(easeIO, t);
      const expected = Math.sqrt(a.x ** 2 + a.y ** 2);
      expect(accelerationMagnitudeAtT(easeIO, t)).toBeCloseTo(expected, 8);
    }
  });
});

// ─── curvatureAtT ─────────────────────────────────────────────────────────────

describe('curvatureAtT', () => {
  it('linear curve: zero curvature everywhere', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(curvatureAtT(linear, t)).toBeCloseTo(0, 5);
    }
  });

  it('ease-in-out: curvature is 0 at t=0.5 (inflection)', () => {
    const kappa = curvatureAtT(easeIO, 0.5);
    expect(kappa).toBeCloseTo(0, 4);
  });

  it('ease-in-out: curvature changes sign across t=0.5 (inflection point)', () => {
    const kBefore = curvatureAtT(easeIO, 0.2);
    const kAfter = curvatureAtT(easeIO, 0.8);
    // Before the inflection: one sign; after: opposite sign
    expect(kBefore).not.toBeNull();
    expect(kAfter).not.toBeNull();
    expect(Math.sign(kBefore!)).toBe(-Math.sign(kAfter!));
  });

  it('S-curve: curvature at t=0 and t=1 have opposite signs', () => {
    const k0 = curvatureAtT(sCurve, 0.1);
    const k1 = curvatureAtT(sCurve, 0.9);
    expect(k0).not.toBeNull();
    expect(k1).not.toBeNull();
    expect(Math.sign(k0!)).toBe(-Math.sign(k1!));
  });

  it('returns null for degenerate zero-speed curve', () => {
    // At t=0.5 the degenerate curve has zero speed
    expect(curvatureAtT(degenerate, 0.5)).toBeNull();
  });
});

// ─── radiusOfCurvatureAtT ─────────────────────────────────────────────────────

describe('radiusOfCurvatureAtT', () => {
  it('linear curve: returns null (infinite radius for straight line)', () => {
    // Curvature = 0 → radius = 1/0 = ∞ → null
    expect(radiusOfCurvatureAtT(linear, 0.5)).toBeNull();
  });

  it('returns null for zero-speed degenerate curve', () => {
    expect(radiusOfCurvatureAtT(degenerate, 0.5)).toBeNull();
  });

  it('returns a positive value for curved segments', () => {
    const r = radiusOfCurvatureAtT(easeIO, 0.1);
    if (r !== null) {
      expect(r).toBeGreaterThan(0);
    }
  });

  it('radius = 1 / |curvature| (inverse relationship)', () => {
    for (const t of [0.1, 0.3, 0.7, 0.9]) {
      const kappa = curvatureAtT(easeIO, t);
      const radius = radiusOfCurvatureAtT(easeIO, t);
      if (kappa !== null && radius !== null && Math.abs(kappa) > 1e-8) {
        expect(radius).toBeCloseTo(1 / Math.abs(kappa), 5);
      }
    }
  });
});

// ─── normalAtT ────────────────────────────────────────────────────────────────

describe('normalAtT', () => {
  it('normal is perpendicular to tangent (dot product ≈ 0)', () => {
    const { tangentAtT } = await import('../src/velocity.ts');
    for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const T = tangentAtT(easeIO, t);
      const N = normalAtT(easeIO, t);
      expect(T).not.toBeNull();
      expect(N).not.toBeNull();
      const dot = T!.x * N!.x + T!.y * N!.y;
      expect(dot).toBeCloseTo(0, 6);
    }
  });

  it('normal is a unit vector', () => {
    for (const t of [0.1, 0.5, 0.9]) {
      const N = normalAtT(easeIO, t);
      expect(N).not.toBeNull();
      const mag = Math.sqrt(N!.x ** 2 + N!.y ** 2);
      expect(mag).toBeCloseTo(1, 6);
    }
  });

  it('returns null for degenerate zero-speed curve', () => {
    expect(normalAtT(degenerate, 0.5)).toBeNull();
  });

  it('linear curve: normal points diagonally perpendicular to (1,1)', () => {
    // Tangent of linear is (√2/2, √2/2); normal should be (-√2/2, √2/2) or (√2/2, -√2/2)
    const N = normalAtT(linear, 0.5);
    expect(N).not.toBeNull();
    const mag = Math.sqrt(N!.x ** 2 + N!.y ** 2);
    expect(mag).toBeCloseTo(1, 6);
    // Normal · tangent = 0
    const half = Math.SQRT2 / 2;
    const dot = half * N!.x + half * N!.y;
    expect(dot).toBeCloseTo(0, 6);
  });
});

// ─── accelerationCurve ────────────────────────────────────────────────────────

describe('accelerationCurve', () => {
  it('returns exactly `count` samples', () => {
    const samples = accelerationCurve(easeIO, 30);
    expect(samples).toHaveLength(30);
  });

  it('first sample t=0, last t=1', () => {
    const samples = accelerationCurve(easeIO, 10);
    expect(samples[0]!.t).toBe(0);
    expect(samples[9]!.t).toBe(1);
  });

  it('magnitude is always non-negative', () => {
    for (const s of accelerationCurve(easeIO, 20)) {
      expect(s.magnitude).toBeGreaterThanOrEqual(0);
    }
  });

  it('curvature and normal are null together', () => {
    for (const s of accelerationCurve(degenerate, 5)) {
      if (s.curvature === null) expect(s.normal).toBeNull();
      if (s.normal === null) expect(s.curvature).toBeNull();
    }
  });

  it('linear curve: all magnitudes ≈ 0, all curvatures ≈ 0', () => {
    for (const s of accelerationCurve(linear, 10)) {
      expect(s.magnitude).toBeCloseTo(0, 5);
      if (s.curvature !== null) expect(s.curvature).toBeCloseTo(0, 5);
    }
  });

  it('throws when count < 2', () => {
    expect(() => accelerationCurve(easeIO, 1)).toThrow(RangeError);
  });
});
