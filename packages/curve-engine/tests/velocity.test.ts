/**
 * Tests for velocity.ts — velocity vectors, speed, tangent, easing velocity.
 */

import { describe, expect, it } from 'vitest';
import { evaluateDerivative } from '../src/evaluate.ts';
import {
  easingVelocity,
  speedAtT,
  tangentAtT,
  velocityAtT,
  velocityCurve,
} from '../src/velocity.ts';
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

// ease-in: P2 = P3, so y arrives linearly from P1→P3 with fast end
const easeIn: ControlPoints = [
  { x: 0, y: 0 },
  { x: 0.42, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: 1 },
];

// ─── velocityAtT ──────────────────────────────────────────────────────────────

describe('velocityAtT', () => {
  it('linear curve: velocity is (1, 1) everywhere', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const v = velocityAtT(linear, t);
      expect(v.x).toBeCloseTo(1, 6);
      expect(v.y).toBeCloseTo(1, 6);
    }
  });

  it('equals evaluateDerivative output', () => {
    for (const t of [0, 0.33, 0.67, 1]) {
      const v = velocityAtT(easeIO, t);
      const d = evaluateDerivative(easeIO, t);
      expect(v.x).toBeCloseTo(d.x, 10);
      expect(v.y).toBeCloseTo(d.y, 10);
    }
  });
});

// ─── speedAtT ─────────────────────────────────────────────────────────────────

describe('speedAtT', () => {
  it('linear curve: constant speed ≈ √2', () => {
    const expectedSpeed = Math.sqrt(2);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(speedAtT(linear, t)).toBeCloseTo(expectedSpeed, 5);
    }
  });

  it('always returns a non-negative value', () => {
    for (const t of [0, 0.1, 0.5, 0.9, 1]) {
      expect(speedAtT(easeIO, t)).toBeGreaterThanOrEqual(0);
    }
  });

  it('ease-in: speed at t=1 > speed at t=0 (fast end)', () => {
    expect(speedAtT(easeIn, 1)).toBeGreaterThan(speedAtT(easeIn, 0));
  });

  it('equals magnitude of velocityAtT', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const v = velocityAtT(easeIO, t);
      const expected = Math.sqrt(v.x * v.x + v.y * v.y);
      expect(speedAtT(easeIO, t)).toBeCloseTo(expected, 8);
    }
  });
});

// ─── tangentAtT ───────────────────────────────────────────────────────────────

describe('tangentAtT', () => {
  it('returns a unit vector (magnitude ≈ 1) for normal curves', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const tangent = tangentAtT(easeIO, t);
      expect(tangent).not.toBeNull();
      const mag = Math.sqrt(tangent!.x ** 2 + tangent!.y ** 2);
      expect(mag).toBeCloseTo(1, 6);
    }
  });

  it('linear curve: tangent is always (√2/2, √2/2)', () => {
    const expected = Math.SQRT2 / 2;
    for (const t of [0, 0.5, 1]) {
      const tangent = tangentAtT(linear, t);
      expect(tangent).not.toBeNull();
      expect(tangent!.x).toBeCloseTo(expected, 5);
      expect(tangent!.y).toBeCloseTo(expected, 5);
    }
  });

  it('ease-in-out at t=0: tangent is horizontal (tangent.y ≈ 0)', () => {
    // The ease-in-out has P1.y = P0.y, so the start tangent is horizontal
    const tangent = tangentAtT(easeIO, 0);
    expect(tangent).not.toBeNull();
    expect(tangent!.y).toBeCloseTo(0, 6);
    expect(tangent!.x).toBeGreaterThan(0);
  });

  it('returns null for a degenerate zero-length curve', () => {
    const degenerate: ControlPoints = [
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
    ];
    // At t=0.5, the derivative of a point curve is (0,0)
    expect(tangentAtT(degenerate, 0.5)).toBeNull();
  });
});

// ─── easingVelocity ───────────────────────────────────────────────────────────

describe('easingVelocity', () => {
  it('linear curve: easing velocity is always 1 (dy/dx = 1)', () => {
    // For the straight line, every unit of x change gives exactly 1 unit of y
    for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      expect(easingVelocity(linear, x)).toBeCloseTo(1, 4);
    }
  });

  it('ease-in: velocity increases monotonically (slow start, fast end)', () => {
    const velocities = [0.1, 0.3, 0.5, 0.7, 0.9].map((x) =>
      easingVelocity(easeIn, x),
    );
    for (let i = 1; i < velocities.length; i++) {
      expect(velocities[i]).toBeGreaterThan(velocities[i - 1]!);
    }
  });

  it('ease-in-out: velocity at x=0.5 is the maximum', () => {
    // For a symmetric ease-in-out, the peak speed is at the midpoint
    const vMid = easingVelocity(easeIO, 0.5);
    const vStart = easingVelocity(easeIO, 0.05);
    const vEnd = easingVelocity(easeIO, 0.95);
    expect(vMid).toBeGreaterThan(vStart);
    expect(vMid).toBeGreaterThan(vEnd);
  });

  it('ease-in-out: velocity is symmetric (v(x) ≈ v(1-x))', () => {
    for (const x of [0.1, 0.2, 0.3, 0.4]) {
      const vLeft = easingVelocity(easeIO, x);
      const vRight = easingVelocity(easeIO, 1 - x);
      expect(vLeft).toBeCloseTo(vRight, 4);
    }
  });
});

// ─── velocityCurve ────────────────────────────────────────────────────────────

describe('velocityCurve', () => {
  it('returns exactly `count` samples', () => {
    const samples = velocityCurve(easeIO, 50);
    expect(samples).toHaveLength(50);
  });

  it('first sample t=0, last sample t=1', () => {
    const samples = velocityCurve(easeIO, 10);
    expect(samples[0]!.t).toBe(0);
    expect(samples[9]!.t).toBe(1);
  });

  it('each sample speed is non-negative', () => {
    const samples = velocityCurve(easeIO, 20);
    for (const s of samples) {
      expect(s.speed).toBeGreaterThanOrEqual(0);
    }
  });

  it('tangent is null only when speed ≈ 0', () => {
    const samples = velocityCurve(easeIO, 10);
    for (const s of samples) {
      if (s.speed < 1e-10) {
        expect(s.tangent).toBeNull();
      } else {
        expect(s.tangent).not.toBeNull();
      }
    }
  });

  it('throws when count < 2', () => {
    expect(() => velocityCurve(easeIO, 1)).toThrow(RangeError);
  });

  it('linear curve: all samples have speed ≈ √2', () => {
    const samples = velocityCurve(linear, 10);
    for (const s of samples) {
      expect(s.speed).toBeCloseTo(Math.sqrt(2), 5);
    }
  });
});
