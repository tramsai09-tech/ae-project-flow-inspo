/**
 * @module normalize
 *
 * Curve normalization, bounding box computation, and handle clamping.
 *
 * ## Normalization
 *
 * "Normalizing" a Bézier curve means scaling and translating its control
 * points so that the resulting curve fits within the unit square [0,1]×[0,1].
 * This is required before using an arbitrary curve as an easing function.
 *
 * ## Bounding box
 *
 * The tight bounding box of a cubic Bézier includes:
 *   1. The two anchor endpoints P0 and P3 (always on the curve).
 *   2. Any local extrema — points where B′x(t) = 0 or B′y(t) = 0.
 *      These are found by solving a quadratic equation derived from the
 *      first derivative being zero.
 *
 * The convex hull of the control points is a loose bounding box; the tight
 * bounding box may be smaller since the curve does not necessarily pass
 * through P1 or P2.
 *
 * ## Extrema
 *
 * For each axis, we solve:
 *
 *   B′(t) = 3[(1−t)²(P₁−P₀) + 2(1−t)t(P₂−P₁) + t²(P₃−P₂)] = 0
 *
 * Let a = P₁−P₀, b = P₂−P₁, c = P₃−P₂.
 * After simplification this becomes the quadratic At² + Bt + C = 0 where:
 *   A = a − 2b + c
 *   B = 2(b − a)
 *   C = a
 *
 * Discriminant Δ = B² − 4AC = 4(b² − ac)
 * t = (−B ± √Δ) / (2A) — only values in (0, 1) are actual extrema.
 */

import { evaluatePoint, evaluateX, evaluateY } from './evaluate.ts';
import type { BoundingBox, ControlPoints, CurveExtrema, Point2D } from './types.ts';

// ─── Internal: extrema solver ──────────────────────────────────────────────────

/**
 * Solve the quadratic At² + Bt + C = 0, returning only roots in (0, 1).
 *
 * @internal
 */
function solveQuadratic(A: number, B: number, C: number): number[] {
  const roots: number[] = [];

  if (Math.abs(A) < 1e-10) {
    // Degenerate — linear equation Bt + C = 0
    if (Math.abs(B) > 1e-10) {
      const t = -C / B;
      if (t > 0 && t < 1) roots.push(t);
    }
    return roots;
  }

  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) return roots; // No real roots

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-B - sqrtD) / (2 * A);
  const t2 = (-B + sqrtD) / (2 * A);

  if (t1 > 0 && t1 < 1) roots.push(t1);
  if (t2 > 0 && t2 < 1 && Math.abs(t2 - t1) > 1e-10) roots.push(t2);

  return roots;
}

/**
 * Find the t values where B′(t) = 0 for a single axis (x or y).
 *
 * @param p0 p1 p2 p3 — the coordinate values for one axis
 * @internal
 */
function extremaAlongAxis(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number[] {
  const a = p1 - p0;      // Q0 / 3
  const b = p2 - p1;      // Q1 / 3
  const c = p3 - p2;      // Q2 / 3

  // B′(t) = 3[(1−t)²a + 2(1−t)t·b + t²c] = 0
  // → At² + Bt + C = 0 where:
  const A = a - 2 * b + c;
  const Bcoef = 2 * (b - a);
  const C = a;

  return solveQuadratic(A, Bcoef, C);
}

// ─── Extrema ───────────────────────────────────────────────────────────────────

/**
 * Find the extreme points of the Bézier curve — the local minima and maxima
 * in each axis where the first derivative is zero.
 *
 * These are the t values needed to compute the tight bounding box.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @returns  CurveExtrema with t values and coordinate values at the extrema
 *
 * @example
 * const extrema = getCurveExtrema(springCurve);
 * // extrema.tExtremaY contains the t values of the overshoot peaks
 */
export function getCurveExtrema(cp: ControlPoints): CurveExtrema {
  const tExtremaX = extremaAlongAxis(cp[0].x, cp[1].x, cp[2].x, cp[3].x);
  const tExtremaY = extremaAlongAxis(cp[0].y, cp[1].y, cp[2].y, cp[3].y);

  // All significant t values (endpoints + extrema)
  const allTX = [0, 1, ...tExtremaX];
  const allTY = [0, 1, ...tExtremaY];

  const extremeX = allTX.map((t) => evaluateX(cp, t));
  const extremeY = allTY.map((t) => evaluateY(cp, t));

  return {
    tExtremaX,
    tExtremaY,
    extremeX,
    extremeY,
  };
}

// ─── Bounding box ──────────────────────────────────────────────────────────────

/**
 * Compute the tight axis-aligned bounding box of the Bézier curve.
 *
 * The bounding box accounts for all extrema in both axes, giving a result
 * that is guaranteed to fully contain the curve. For curves that overshoot
 * (e.g. spring easings), the bounding box will extend outside [0, 1].
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @returns  BoundingBox with minX, maxX, minY, maxY, width, height
 *
 * @example
 * // Standard ease curve — stays within unit square
 * getBoundingBox(easeCurve);
 * // → { minX: 0, maxX: 1, minY: 0, maxY: 1, width: 1, height: 1 }
 *
 * // Spring curve — overshoots y=1
 * getBoundingBox(springCurve);
 * // → { minX: 0, maxX: 1, minY: 0, maxY: 1.3, width: 1, height: 1.3 }
 */
export function getBoundingBox(cp: ControlPoints): BoundingBox {
  const extrema = getCurveExtrema(cp);

  const minX = Math.min(...extrema.extremeX);
  const maxX = Math.max(...extrema.extremeX);
  const minY = Math.min(...extrema.extremeY);
  const maxY = Math.max(...extrema.extremeY);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ─── Normalization ─────────────────────────────────────────────────────────────

/**
 * Translate and uniformly scale a curve's control points so that its
 * bounding box fills the unit square [0, 1] × [0, 1].
 *
 * The transformation applied is:
 *   x′ = (x − minX) / width
 *   y′ = (y − minY) / height
 *
 * **Note**: For standard easing curves (P0=(0,0), P3=(1,1)) that do not
 * overshoot, this is a no-op. It is most useful for:
 *   - Arbitrary path curves that do not start at the origin
 *   - Spring / bounce curves that overshoot [0,1]
 *   - Imported curves from external tools with arbitrary coordinate ranges
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @returns  New ControlPoints scaled to [0, 1] × [0, 1]
 * @throws   RangeError if the curve is degenerate (zero width or height)
 *
 * @example
 * const raw: ControlPoints = [
 *   { x: 10, y: 5 }, { x: 20, y: 50 },
 *   { x: 80, y: 60 }, { x: 90, y: 95 },
 * ];
 * const normalized = normalizeCurve(raw);
 * // normalized[0] → { x: 0, y: 0 }
 * // normalized[3] → { x: 1, y: 1 }
 */
export function normalizeCurve(cp: ControlPoints): ControlPoints {
  const box = getBoundingBox(cp);

  if (box.width < 1e-10) {
    throw new RangeError(
      `Cannot normalize curve: width is ${box.width} (degenerate in X axis)`,
    );
  }
  if (box.height < 1e-10) {
    throw new RangeError(
      `Cannot normalize curve: height is ${box.height} (degenerate in Y axis)`,
    );
  }

  const scalePoint = (p: Point2D): Point2D => ({
    x: (p.x - box.minX) / box.width,
    y: (p.y - box.minY) / box.height,
  });

  return [
    scalePoint(cp[0]),
    scalePoint(cp[1]),
    scalePoint(cp[2]),
    scalePoint(cp[3]),
  ];
}

/**
 * Clamp all four control points so their coordinates lie within the
 * axis-aligned range defined by [P0, P3].
 *
 * This enforces that a curve's handles cannot "escape" beyond the anchor
 * range — useful for constraining an easing curve to the unit square without
 * distorting the anchor positions.
 *
 * Specifically:
 *   - x is clamped to [min(P0.x, P3.x), max(P0.x, P3.x)]
 *   - y is clamped to [min(P0.y, P3.y), max(P0.y, P3.y)]
 *
 * The anchor points P0 and P3 are returned unchanged.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @returns  New ControlPoints with P1 and P2 clamped
 *
 * @example
 * // Clamp an overshoot handle to stay within [0,1]×[0,1]
 * const clamped = clampHandles(springCurve);
 */
export function clampHandles(cp: ControlPoints): ControlPoints {
  const minX = Math.min(cp[0].x, cp[3].x);
  const maxX = Math.max(cp[0].x, cp[3].x);
  const minY = Math.min(cp[0].y, cp[3].y);
  const maxY = Math.max(cp[0].y, cp[3].y);

  const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));

  const clampPoint = (p: Point2D): Point2D => ({
    x: clamp(p.x, minX, maxX),
    y: clamp(p.y, minY, maxY),
  });

  return [
    cp[0],
    clampPoint(cp[1]),
    clampPoint(cp[2]),
    cp[3],
  ];
}

/**
 * Check whether the x-coordinates of a curve are monotonically increasing
 * (required for valid easing evaluation).
 *
 * A curve is x-monotone when B′x(t) ≥ 0 for all t ∈ [0, 1], meaning each
 * x value maps to a unique t. If false, the Newton-Raphson easing solver
 * may return unexpected results.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @returns  true if Bx is monotonically non-decreasing
 *
 * @example
 * isXMonotone(standardEase);  // → true
 * isXMonotone(loopingCurve);  // → false
 */
export function isXMonotone(cp: ControlPoints): boolean {
  // A cubic Bézier's x derivative is a quadratic.
  // We check that no x-extrema exist in (0, 1) — if none do, it's monotone.
  const tExtrema = extremaAlongAxis(cp[0].x, cp[1].x, cp[2].x, cp[3].x);
  return tExtrema.length === 0;
}

/**
 * Sample the curve at many t values and return the points as a flat
 * array of [x0,y0, x1,y1, ...] — useful for canvas Path2D rendering.
 *
 * @param cp         - Control points
 * @param resolution - Number of segments (output has resolution+1 points)
 * @returns          Flat Float64Array of interleaved x,y coordinates
 */
export function toPolyline(cp: ControlPoints, resolution = 64): Float64Array {
  const result = new Float64Array((resolution + 1) * 2);
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    const p = evaluatePoint(cp, t);
    result[i * 2] = p.x;
    result[i * 2 + 1] = p.y;
  }
  return result;
}
