/**
 * Tests for evaluate.ts — cubic Bézier evaluation, derivatives, and easing solver.
 *
 * Reference curves used throughout:
 *   - `linear`   — P0=(0,0), P1=(1/3,1/3), P2=(2/3,2/3), P3=(1,1)
 *                  Straight diagonal line. Constant speed, zero second derivative.
 *   - `easeIO`   — CSS cubic-bezier(0.42, 0, 0.58, 1) ease-in-out
 *                  Symmetric: slow start, fast middle, slow end.
 *   - `easeIn`   — CSS cubic-bezier(0.42, 0, 1, 1)
 *                  Slow start, fast end.
 */

import { describe, expect, it } from 'vitest';
import {
  evaluateDerivative,
  evaluateEasing,
  evaluatePoint,
  evaluateSecondDerivative,
  evaluateX,
  evaluateY,
  solveTForX,
} from '../src/evaluate.ts';
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

const easeIn: ControlPoints = [
  { x: 0, y: 0 },
  { x: 0.42, y: 0 },
  { x: 1, y: 1 },
  { x: 1, y: 1 },
];

// ─── evaluatePoint ─────────────────────────────────────────────────────────────

describe('evaluatePoint', () => {
  it('returns P0 at t=0', () => {
    const p = evaluatePoint(linear, 0);
    expect(p.x).toBeCloseTo(0, 10);
    expect(p.y).toBeCloseTo(0, 10);
  });

  it('returns P3 at t=1', () => {
    const p = evaluatePoint(linear, 1);
    expect(p.x).toBeCloseTo(1, 10);
    expect(p.y).toBeCloseTo(1, 10);
  });

  it('returns midpoint for linear curve at t=0.5', () => {
    const p = evaluatePoint(linear, 0.5);
    expect(p.x).toBeCloseTo(0.5, 10);
    expect(p.y).toBeCloseTo(0.5, 10);
  });

  it('evaluates symmetric ease-in-out at t=0.5 to (0.5, 0.5)', () => {
    // The ease-in-out is symmetric, so the midpoint of the parametric
    // curve falls at (0.5, 0.5)
    const p = evaluatePoint(easeIO, 0.5);
    expect(p.x).toBeCloseTo(0.5, 10);
    expect(p.y).toBeCloseTo(0.5, 10);
  });

  it('respects Bézier endpoints for any curve', () => {
    const curves: ControlPoints[] = [linear, easeIO, easeIn];
    for (const cp of curves) {
      expect(evaluatePoint(cp, 0).x).toBeCloseTo(cp[0].x, 10);
      expect(evaluatePoint(cp, 0).y).toBeCloseTo(cp[0].y, 10);
      expect(evaluatePoint(cp, 1).x).toBeCloseTo(cp[3].x, 10);
      expect(evaluatePoint(cp, 1).y).toBeCloseTo(cp[3].y, 10);
    }
  });
});

// ─── evaluateX / evaluateY ─────────────────────────────────────────────────────

describe('evaluateX / evaluateY', () => {
  it('evaluateX matches evaluatePoint.x', () => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(evaluateX(easeIO, t)).toBeCloseTo(evaluatePoint(easeIO, t).x, 10);
    }
  });

  it('evaluateY matches evaluatePoint.y', () => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      expect(evaluateY(easeIO, t)).toBeCloseTo(evaluatePoint(easeIO, t).y, 10);
    }
  });
});

// ─── evaluateDerivative ────────────────────────────────────────────────────────

describe('evaluateDerivative', () => {
  it('returns (1, 1) everywhere on the linear curve', () => {
    // The derivative of a straight line is constant
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const d = evaluateDerivative(linear, t);
      expect(d.x).toBeCloseTo(1, 8);
      expect(d.y).toBeCloseTo(1, 8);
    }
  });

  it('ease-in-out: horizontal tangent at t=0 (y-component = 0)', () => {
    const d = evaluateDerivative(easeIO, 0);
    // P1.y = 0, so the start tangent is horizontal
    expect(d.y).toBeCloseTo(0, 8);
    expect(d.x).toBeGreaterThan(0); // x-component must be positive
  });

  it('ease-in-out: horizontal tangent at t=1 (y-component = 0)', () => {
    const d = evaluateDerivative(easeIO, 1);
    // P2.y = 1 = P3.y, so the end tangent is horizontal
    expect(d.y).toBeCloseTo(0, 8);
    expect(d.x).toBeGreaterThan(0);
  });

  it('ease-in-out: derivative at t=0 equals 3*(P1-P0)', () => {
    const d = evaluateDerivative(easeIO, 0);
    expect(d.x).toBeCloseTo(3 * (easeIO[1].x - easeIO[0].x), 8);
    expect(d.y).toBeCloseTo(3 * (easeIO[1].y - easeIO[0].y), 8);
  });

  it('ease-in-out: derivative at t=1 equals 3*(P3-P2)', () => {
    const d = evaluateDerivative(easeIO, 1);
    expect(d.x).toBeCloseTo(3 * (easeIO[3].x - easeIO[2].x), 8);
    expect(d.y).toBeCloseTo(3 * (easeIO[3].y - easeIO[2].y), 8);
  });
});

// ─── evaluateSecondDerivative ──────────────────────────────────────────────────

describe('evaluateSecondDerivative', () => {
  it('is zero everywhere on the linear curve (straight line = no bending)', () => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const d2 = evaluateSecondDerivative(linear, t);
      expect(d2.x).toBeCloseTo(0, 8);
      expect(d2.y).toBeCloseTo(0, 8);
    }
  });

  it('ease-in-out: second derivative is (0,0) at t=0.5 (inflection point)', () => {
    // The symmetric ease-in-out curve has its inflection point at t=0.5
    const d2 = evaluateSecondDerivative(easeIO, 0.5);
    expect(d2.x).toBeCloseTo(0, 6);
    expect(d2.y).toBeCloseTo(0, 6);
  });

  it('evaluates at t=0 as 6*(P2 - 2*P1 + P0)', () => {
    // B″(0) = 6*(P₂ − 2P₁ + P₀)
    const d2 = evaluateSecondDerivative(easeIO, 0);
    const expectedX = 6 * (easeIO[2].x - 2 * easeIO[1].x + easeIO[0].x);
    const expectedY = 6 * (easeIO[2].y - 2 * easeIO[1].y + easeIO[0].y);
    expect(d2.x).toBeCloseTo(expectedX, 8);
    expect(d2.y).toBeCloseTo(expectedY, 8);
  });

  it('evaluates at t=1 as 6*(P3 - 2*P2 + P1)', () => {
    // B″(1) = 6*(P₃ − 2P₂ + P₁)
    const d2 = evaluateSecondDerivative(easeIO, 1);
    const expectedX = 6 * (easeIO[3].x - 2 * easeIO[2].x + easeIO[1].x);
    const expectedY = 6 * (easeIO[3].y - 2 * easeIO[2].y + easeIO[1].y);
    expect(d2.x).toBeCloseTo(expectedX, 8);
    expect(d2.y).toBeCloseTo(expectedY, 8);
  });
});

// ─── solveTForX ───────────────────────────────────────────────────────────────

describe('solveTForX', () => {
  it('returns 0 for x ≤ P0.x', () => {
    expect(solveTForX(easeIO, 0)).toBe(0);
    expect(solveTForX(easeIO, -0.1)).toBe(0);
  });

  it('returns 1 for x ≥ P3.x', () => {
    expect(solveTForX(easeIO, 1)).toBe(1);
    expect(solveTForX(easeIO, 1.5)).toBe(1);
  });

  it('solves correctly — Bx(solveTForX(cp, x)) ≈ x', () => {
    const xs = [0.1, 0.25, 0.5, 0.75, 0.9];
    for (const x of xs) {
      const t = solveTForX(easeIO, x);
      expect(evaluateX(easeIO, t)).toBeCloseTo(x, 6);
    }
  });

  it('works for the linear curve: t ≈ x', () => {
    const xs = [0.1, 0.3, 0.5, 0.7, 0.9];
    for (const x of xs) {
      const t = solveTForX(linear, x);
      expect(t).toBeCloseTo(x, 6);
    }
  });

  it('respects custom epsilon', () => {
    const t = solveTForX(easeIO, 0.5, { epsilon: 1e-4 });
    expect(evaluateX(easeIO, t)).toBeCloseTo(0.5, 3);
  });
});

// ─── evaluateEasing ───────────────────────────────────────────────────────────

describe('evaluateEasing', () => {
  it('returns P0.y at x=0', () => {
    expect(evaluateEasing(easeIO, 0)).toBeCloseTo(0, 8);
  });

  it('returns P3.y at x=1', () => {
    expect(evaluateEasing(easeIO, 1)).toBeCloseTo(1, 8);
  });

  it('returns 0.5 at x=0.5 for symmetric ease-in-out', () => {
    expect(evaluateEasing(easeIO, 0.5)).toBeCloseTo(0.5, 5);
  });

  it('ease-in: y < x for x ∈ (0, 1) (slow start)', () => {
    // An ease-in curve lags behind linear in the first half
    for (const x of [0.1, 0.2, 0.3, 0.4, 0.6]) {
      expect(evaluateEasing(easeIn, x)).toBeLessThan(x);
    }
  });

  it('returns same result as evaluateY(solveTForX(cp, x))', () => {
    const xs = [0.1, 0.3, 0.5, 0.7, 0.9];
    for (const x of xs) {
      const direct = evaluateEasing(easeIO, x);
      const manual = evaluateY(easeIO, solveTForX(easeIO, x));
      expect(direct).toBeCloseTo(manual, 8);
    }
  });
});
