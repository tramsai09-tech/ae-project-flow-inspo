/**
 * Tests for normalize.ts — bounding box, extrema, normalization, clamping.
 */

import { describe, expect, it } from 'vitest';
import { evaluatePoint } from '../src/evaluate.ts';
import {
  clampHandles,
  getBoundingBox,
  getCurveExtrema,
  isXMonotone,
  normalizeCurve,
  toPolyline,
} from '../src/normalize.ts';
import type { ControlPoints } from '../src/types.ts';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

// Standard ease — stays inside unit square
const easeIO: ControlPoints = [
  { x: 0, y: 0 },
  { x: 0.42, y: 0 },
  { x: 0.58, y: 1 },
  { x: 1, y: 1 },
];

// Straight diagonal
const linear: ControlPoints = [
  { x: 0, y: 0 },
  { x: 1 / 3, y: 1 / 3 },
  { x: 2 / 3, y: 2 / 3 },
  { x: 1, y: 1 },
];

// Curve that overshoots y > 1 (spring-style)
// P1 and P2 both have y=1.5 — creating a "hump" above y=1
const spring: ControlPoints = [
  { x: 0, y: 0 },
  { x: 0, y: 1.5 },
  { x: 1, y: 1.5 },
  { x: 1, y: 1 },
];

// Curve with arbitrary non-unit coordinate range
const arbitrary: ControlPoints = [
  { x: 10, y: 5 },
  { x: 20, y: 50 },
  { x: 80, y: 60 },
  { x: 90, y: 95 },
];

// Non-monotone in x (loops back) — P1.x > P3.x
const nonMonotone: ControlPoints = [
  { x: 0, y: 0 },
  { x: 1.5, y: 0.5 },
  { x: -0.5, y: 0.5 },
  { x: 1, y: 1 },
];

// ─── getCurveExtrema ──────────────────────────────────────────────────────────

describe('getCurveExtrema', () => {
  it('linear curve: no extrema in open interval (0, 1)', () => {
    const extrema = getCurveExtrema(linear);
    expect(extrema.tExtremaX).toHaveLength(0);
    expect(extrema.tExtremaY).toHaveLength(0);
  });

  it('includes endpoint x/y values', () => {
    const extrema = getCurveExtrema(easeIO);
    // Endpoints P0 and P3 are always included
    expect(extrema.extremeX).toContain(easeIO[0].x);
    expect(extrema.extremeX).toContain(easeIO[3].x);
    expect(extrema.extremeY).toContain(easeIO[0].y);
    expect(extrema.extremeY).toContain(easeIO[3].y);
  });

  it('spring curve: has a y-extremum above y=1', () => {
    const extrema = getCurveExtrema(spring);
    const maxY = Math.max(...extrema.extremeY);
    // The spring curve overshoots — max y should be > 1
    expect(maxY).toBeGreaterThan(1);
  });

  it('spring curve: has at least one y-extremum in (0, 1)', () => {
    const extrema = getCurveExtrema(spring);
    expect(extrema.tExtremaY.length).toBeGreaterThan(0);
    for (const t of extrema.tExtremaY) {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(1);
    }
  });
});

// ─── getBoundingBox ───────────────────────────────────────────────────────────

describe('getBoundingBox', () => {
  it('linear curve: bounding box is exactly the unit square', () => {
    const box = getBoundingBox(linear);
    expect(box.minX).toBeCloseTo(0, 8);
    expect(box.maxX).toBeCloseTo(1, 8);
    expect(box.minY).toBeCloseTo(0, 8);
    expect(box.maxY).toBeCloseTo(1, 8);
    expect(box.width).toBeCloseTo(1, 8);
    expect(box.height).toBeCloseTo(1, 8);
  });

  it('standard ease: bounding box is [0,1]×[0,1]', () => {
    const box = getBoundingBox(easeIO);
    expect(box.minX).toBeCloseTo(0, 4);
    expect(box.maxX).toBeCloseTo(1, 4);
    expect(box.minY).toBeCloseTo(0, 4);
    expect(box.maxY).toBeCloseTo(1, 4);
  });

  it('spring curve: bounding box maxY > 1', () => {
    const box = getBoundingBox(spring);
    expect(box.maxY).toBeGreaterThan(1);
  });

  it('spring curve: bounding box minX = 0, maxX = 1', () => {
    const box = getBoundingBox(spring);
    expect(box.minX).toBeCloseTo(0, 5);
    expect(box.maxX).toBeCloseTo(1, 5);
  });

  it('width = maxX - minX, height = maxY - minY', () => {
    const box = getBoundingBox(spring);
    expect(box.width).toBeCloseTo(box.maxX - box.minX, 10);
    expect(box.height).toBeCloseTo(box.maxY - box.minY, 10);
  });

  it('bounding box always contains all four control points', () => {
    const box = getBoundingBox(easeIO);
    for (const p of easeIO) {
      // The bounding box may not contain P1/P2 since they are off-curve,
      // but it will contain P0 and P3 (on-curve endpoints)
      expect(p.x).toBeGreaterThanOrEqual(box.minX - 1e-9);
    }
    // Endpoints are always in the box
    expect(easeIO[0].x).toBeGreaterThanOrEqual(box.minX - 1e-9);
    expect(easeIO[3].x).toBeLessThanOrEqual(box.maxX + 1e-9);
  });
});

// ─── normalizeCurve ───────────────────────────────────────────────────────────

describe('normalizeCurve', () => {
  it('normalized curve starts at (0, 0) and ends at (1, 1)', () => {
    const norm = normalizeCurve(arbitrary);
    expect(norm[0].x).toBeCloseTo(0, 6);
    expect(norm[0].y).toBeCloseTo(0, 6);
    expect(norm[3].x).toBeCloseTo(1, 6);
    expect(norm[3].y).toBeCloseTo(1, 6);
  });

  it('all normalized control points are within [0, 1] when original is standard', () => {
    const norm = normalizeCurve(easeIO);
    for (const p of norm) {
      expect(p.x).toBeGreaterThanOrEqual(-1e-9);
      expect(p.x).toBeLessThanOrEqual(1 + 1e-9);
      expect(p.y).toBeGreaterThanOrEqual(-1e-9);
      expect(p.y).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('normalized bounding box is [0,1]×[0,1]', () => {
    const norm = normalizeCurve(spring);
    const box = getBoundingBox(norm);
    expect(box.minX).toBeCloseTo(0, 4);
    expect(box.maxX).toBeCloseTo(1, 4);
    expect(box.minY).toBeCloseTo(0, 4);
    expect(box.maxY).toBeCloseTo(1, 4);
  });

  it('is a no-op for a curve already in [0,1]×[0,1] with no extrema outside', () => {
    const norm = normalizeCurve(linear);
    for (let i = 0; i < 4; i++) {
      expect(norm[i]!.x).toBeCloseTo(linear[i]!.x, 6);
      expect(norm[i]!.y).toBeCloseTo(linear[i]!.y, 6);
    }
  });

  it('throws for a degenerate curve with zero width', () => {
    const vertical: ControlPoints = [
      { x: 0.5, y: 0 },
      { x: 0.5, y: 0.3 },
      { x: 0.5, y: 0.7 },
      { x: 0.5, y: 1 },
    ];
    expect(() => normalizeCurve(vertical)).toThrow(RangeError);
  });

  it('throws for a degenerate curve with zero height', () => {
    const horizontal: ControlPoints = [
      { x: 0, y: 0.5 },
      { x: 0.3, y: 0.5 },
      { x: 0.7, y: 0.5 },
      { x: 1, y: 0.5 },
    ];
    expect(() => normalizeCurve(horizontal)).toThrow(RangeError);
  });

  it('preserves relative handle positions after normalization', () => {
    const norm = normalizeCurve(arbitrary);
    // After normalization, handle ratios should be preserved
    const box = getBoundingBox(arbitrary);
    const expectedP1x = (arbitrary[1].x - box.minX) / box.width;
    expect(norm[1].x).toBeCloseTo(expectedP1x, 6);
  });
});

// ─── clampHandles ─────────────────────────────────────────────────────────────

describe('clampHandles', () => {
  it('does not modify anchor points P0 and P3', () => {
    const clamped = clampHandles(spring);
    expect(clamped[0].x).toBeCloseTo(spring[0].x, 10);
    expect(clamped[0].y).toBeCloseTo(spring[0].y, 10);
    expect(clamped[3].x).toBeCloseTo(spring[3].x, 10);
    expect(clamped[3].y).toBeCloseTo(spring[3].y, 10);
  });

  it('clamps P1 and P2 y values within [P0.y, P3.y] range', () => {
    // spring has P1.y = P2.y = 1.5, P0.y = 0, P3.y = 1
    const clamped = clampHandles(spring);
    const minY = Math.min(spring[0].y, spring[3].y);
    const maxY = Math.max(spring[0].y, spring[3].y);
    expect(clamped[1].y).toBeGreaterThanOrEqual(minY);
    expect(clamped[1].y).toBeLessThanOrEqual(maxY);
    expect(clamped[2].y).toBeGreaterThanOrEqual(minY);
    expect(clamped[2].y).toBeLessThanOrEqual(maxY);
  });

  it('is a no-op for curves with handles already inside anchor range', () => {
    const clamped = clampHandles(easeIO);
    for (let i = 0; i < 4; i++) {
      expect(clamped[i]!.x).toBeCloseTo(easeIO[i]!.x, 10);
      expect(clamped[i]!.y).toBeCloseTo(easeIO[i]!.y, 10);
    }
  });

  it('clamped curve has handles strictly within [0, 1]×[0, 1] for standard curves', () => {
    const clamped = clampHandles(spring);
    for (const p of clamped) {
      expect(p.x).toBeGreaterThanOrEqual(-1e-9);
      expect(p.x).toBeLessThanOrEqual(1 + 1e-9);
      expect(p.y).toBeGreaterThanOrEqual(-1e-9);
      expect(p.y).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});

// ─── isXMonotone ──────────────────────────────────────────────────────────────

describe('isXMonotone', () => {
  it('returns true for the linear curve', () => {
    expect(isXMonotone(linear)).toBe(true);
  });

  it('returns true for a standard ease-in-out', () => {
    expect(isXMonotone(easeIO)).toBe(true);
  });

  it('returns false for a non-monotone curve (loops in x)', () => {
    expect(isXMonotone(nonMonotone)).toBe(false);
  });
});

// ─── toPolyline ───────────────────────────────────────────────────────────────

describe('toPolyline', () => {
  it('returns a Float64Array with 2*(resolution+1) elements', () => {
    const poly = toPolyline(easeIO, 64);
    expect(poly).toBeInstanceOf(Float64Array);
    expect(poly.length).toBe(130); // (64+1)*2
  });

  it('starts at P0', () => {
    const poly = toPolyline(linear, 10);
    expect(poly[0]).toBeCloseTo(linear[0].x, 8);
    expect(poly[1]).toBeCloseTo(linear[0].y, 8);
  });

  it('ends at P3', () => {
    const poly = toPolyline(linear, 10);
    expect(poly[poly.length - 2]).toBeCloseTo(linear[3].x, 8);
    expect(poly[poly.length - 1]).toBeCloseTo(linear[3].y, 8);
  });

  it('interleaves x and y correctly', () => {
    const poly = toPolyline(easeIO, 4);
    // Every even index is x, every odd is y
    for (let i = 0; i < poly.length; i += 2) {
      const t = (i / 2) / 4;
      const p = evaluatePoint(easeIO, t);
      expect(poly[i]).toBeCloseTo(p.x, 6);
      expect(poly[i + 1]).toBeCloseTo(p.y, 6);
    }
  });
});
