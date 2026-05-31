/**
 * @module evaluate
 *
 * Core cubic Bézier evaluation functions.
 *
 * A cubic Bézier curve is defined by four control points P0–P3 and a
 * parameter t ∈ [0, 1]:
 *
 *   B(t) = (1−t)³P₀ + 3(1−t)²tP₁ + 3(1−t)t²P₂ + t³P₃
 *
 * This module provides:
 *   - Point evaluation:          B(t)
 *   - First derivative:          B′(t)   (tangent / velocity direction)
 *   - Second derivative:         B″(t)   (acceleration direction)
 *   - Easing solver:             given x ∈ [0,1], find t such that Bx(t) = x
 *   - Easing evaluation:         given x, return By(t) — the y value on the curve
 *
 * All functions are pure — no mutation, no side effects.
 */

import type { ControlPoints, Point2D, SolverOptions } from './types.ts';

// ─── Internal constants ────────────────────────────────────────────────────────

const DEFAULT_EPSILON = 1e-7;
const DEFAULT_MAX_ITERATIONS = 12;
/** Threshold below which a derivative is treated as zero (degenerate segment) */
const DERIVATIVE_EPSILON = 1e-10;

// ─── Bernstein basis helpers ───────────────────────────────────────────────────
// These are the four Bernstein basis polynomials for degree n=3.

/** B₀,₃(t) = (1−t)³ */
function b0(t: number): number {
  const mt = 1 - t;
  return mt * mt * mt;
}

/** B₁,₃(t) = 3(1−t)²t */
function b1(t: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * t;
}

/** B₂,₃(t) = 3(1−t)t² */
function b2(t: number): number {
  const mt = 1 - t;
  return 3 * mt * t * t;
}

/** B₃,₃(t) = t³ */
function b3(t: number): number {
  return t * t * t;
}

// ─── Point evaluation ──────────────────────────────────────────────────────────

/**
 * Evaluate the x-coordinate of the Bézier curve at parameter t.
 *
 * Bx(t) = (1−t)³x₀ + 3(1−t)²t·x₁ + 3(1−t)t²·x₂ + t³x₃
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  x-coordinate on the curve
 */
export function evaluateX(cp: ControlPoints, t: number): number {
  return b0(t) * cp[0].x + b1(t) * cp[1].x + b2(t) * cp[2].x + b3(t) * cp[3].x;
}

/**
 * Evaluate the y-coordinate of the Bézier curve at parameter t.
 *
 * By(t) = (1−t)³y₀ + 3(1−t)²t·y₁ + 3(1−t)t²·y₂ + t³y₃
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  y-coordinate on the curve
 */
export function evaluateY(cp: ControlPoints, t: number): number {
  return b0(t) * cp[0].y + b1(t) * cp[1].y + b2(t) * cp[2].y + b3(t) * cp[3].y;
}

/**
 * Evaluate the 2D point B(t) on the Bézier curve.
 *
 * B(t) = (1−t)³P₀ + 3(1−t)²tP₁ + 3(1−t)t²P₂ + t³P₃
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  2D point on the curve
 *
 * @example
 * const cp: ControlPoints = [
 *   { x: 0, y: 0 }, { x: 0.42, y: 0 },
 *   { x: 0.58, y: 1 }, { x: 1, y: 1 },
 * ];
 * evaluatePoint(cp, 0.5); // → { x: 0.5, y: 0.5 }
 */
export function evaluatePoint(cp: ControlPoints, t: number): Point2D {
  const w0 = b0(t);
  const w1 = b1(t);
  const w2 = b2(t);
  const w3 = b3(t);
  return {
    x: w0 * cp[0].x + w1 * cp[1].x + w2 * cp[2].x + w3 * cp[3].x,
    y: w0 * cp[0].y + w1 * cp[1].y + w2 * cp[2].y + w3 * cp[3].y,
  };
}

// ─── Derivatives ───────────────────────────────────────────────────────────────

/**
 * Evaluate the first derivative B′(t) of the Bézier curve at parameter t.
 *
 * The first derivative is itself a quadratic Bézier over the difference vectors:
 *
 *   B′(t) = 3 · [(1−t)²(P₁−P₀) + 2(1−t)t(P₂−P₁) + t²(P₃−P₂)]
 *
 * This vector is tangent to the curve and has magnitude equal to the speed.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  First derivative vector B′(t)
 */
export function evaluateDerivative(cp: ControlPoints, t: number): Point2D {
  const mt = 1 - t;
  const c0 = 3 * mt * mt;  // 3(1−t)²
  const c1 = 6 * mt * t;   // 6(1−t)t
  const c2 = 3 * t * t;    // 3t²

  return {
    x: c0 * (cp[1].x - cp[0].x) + c1 * (cp[2].x - cp[1].x) + c2 * (cp[3].x - cp[2].x),
    y: c0 * (cp[1].y - cp[0].y) + c1 * (cp[2].y - cp[1].y) + c2 * (cp[3].y - cp[2].y),
  };
}

/**
 * Evaluate the x-component of the first derivative B′x(t).
 * Exposed separately for use in the Newton-Raphson solver.
 *
 * @internal
 */
export function evaluateDerivativeX(cp: ControlPoints, t: number): number {
  const mt = 1 - t;
  return (
    3 * mt * mt * (cp[1].x - cp[0].x) +
    6 * mt * t * (cp[2].x - cp[1].x) +
    3 * t * t * (cp[3].x - cp[2].x)
  );
}

/**
 * Evaluate the second derivative B″(t) of the Bézier curve at parameter t.
 *
 * The second derivative is a linear Bézier (straight interpolation):
 *
 *   B″(t) = 6 · [(1−t)(P₂−2P₁+P₀) + t(P₃−2P₂+P₁)]
 *
 * This vector describes the curvature acceleration of the curve.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Second derivative vector B″(t)
 *
 * @example
 * // A perfectly straight line has zero second derivative everywhere
 * const linear: ControlPoints = [
 *   { x: 0, y: 0 }, { x: 1/3, y: 1/3 },
 *   { x: 2/3, y: 2/3 }, { x: 1, y: 1 },
 * ];
 * evaluateSecondDerivative(linear, 0.5); // → { x: 0, y: 0 }
 */
export function evaluateSecondDerivative(cp: ControlPoints, t: number): Point2D {
  const mt = 1 - t;

  // A = P₂ − 2P₁ + P₀
  const ax = cp[2].x - 2 * cp[1].x + cp[0].x;
  const ay = cp[2].y - 2 * cp[1].y + cp[0].y;

  // B = P₃ − 2P₂ + P₁
  const bx = cp[3].x - 2 * cp[2].x + cp[1].x;
  const by = cp[3].y - 2 * cp[2].y + cp[1].y;

  return {
    x: 6 * (mt * ax + t * bx),
    y: 6 * (mt * ay + t * by),
  };
}

// ─── Easing solver ─────────────────────────────────────────────────────────────

/**
 * Find the curve parameter t such that Bx(t) ≈ x.
 *
 * This is the inverse problem — given an x value on the time axis, find
 * the parameter t. The algorithm uses Newton-Raphson iteration with a
 * bisection fallback for robustness.
 *
 * **Prerequisite**: The x-coordinates of the curve must be monotonically
 * increasing (Bx is a strictly increasing function of t). This is satisfied
 * when P1.x ∈ [0, 1] and P2.x ∈ [0, 1] for a standard easing curve.
 *
 * @param cp      - Control points [P0, P1, P2, P3]
 * @param x       - Target x value (normalized time), x ∈ [0, 1]
 * @param options - Solver convergence options
 * @returns       Parameter t such that Bx(t) ≈ x
 *
 * @example
 * // CSS cubic-bezier(0.42, 0, 0.58, 1) — ease-in-out
 * const cp: ControlPoints = [
 *   { x: 0, y: 0 }, { x: 0.42, y: 0 },
 *   { x: 0.58, y: 1 }, { x: 1, y: 1 },
 * ];
 * solveTForX(cp, 0.5); // → 0.5 (symmetric curve)
 */
export function solveTForX(
  cp: ControlPoints,
  x: number,
  options: SolverOptions = {},
): number {
  // Boundary conditions — no solving needed
  if (x <= cp[0].x) return 0;
  if (x >= cp[3].x) return 1;

  const epsilon = options.epsilon ?? DEFAULT_EPSILON;
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;

  // ── Newton-Raphson ────────────────────────────────────────────────────────
  // Start with a linear guess (t ≈ x when the curve is close to linear).
  let t = x;

  for (let i = 0; i < maxIterations; i++) {
    const xCurrent = evaluateX(cp, t);
    const xError = xCurrent - x;

    if (Math.abs(xError) < epsilon) return t;

    const dx = evaluateDerivativeX(cp, t);

    // Derivative near zero — Newton step would explode. Fall back to bisection.
    if (Math.abs(dx) < DERIVATIVE_EPSILON) break;

    const tNext = t - xError / dx;

    // Newton step went outside [0, 1] — fall back to bisection.
    if (tNext < 0 || tNext > 1) break;

    t = tNext;
  }

  // ── Bisection fallback ─────────────────────────────────────────────────────
  // Guaranteed to converge for any monotone Bx, just slower (linear).
  let lo = 0;
  let hi = 1;

  while (hi - lo > epsilon) {
    t = (lo + hi) / 2;
    const xMid = evaluateX(cp, t);
    if (xMid < x) {
      lo = t;
    } else {
      hi = t;
    }
  }

  return (lo + hi) / 2;
}

/**
 * Evaluate the easing output y for a given normalized input x.
 *
 * This is the primary function for using a Bézier curve as a CSS-style
 * easing function: given x ∈ [0, 1] (representing normalized time),
 * return y ∈ [0, 1] (representing normalized value — though y may exceed
 * [0, 1] for spring / overshoot curves).
 *
 * Internally: finds t such that Bx(t) = x, then returns By(t).
 *
 * @param cp      - Control points. Typically P0=(0,0), P3=(1,1).
 * @param x       - Normalized time input, x ∈ [0, 1]
 * @param options - Solver options (epsilon, maxIterations)
 * @returns       y-value on the curve at the given x
 *
 * @example
 * // CSS cubic-bezier(0.25, 0.1, 0.25, 1) — ease
 * const cp: ControlPoints = [
 *   { x: 0, y: 0 }, { x: 0.25, y: 0.1 },
 *   { x: 0.25, y: 1 }, { x: 1, y: 1 },
 * ];
 * evaluateEasing(cp, 0);   // → 0
 * evaluateEasing(cp, 1);   // → 1
 * evaluateEasing(cp, 0.5); // → ~0.84 (fast early, slow late)
 */
export function evaluateEasing(
  cp: ControlPoints,
  x: number,
  options?: SolverOptions,
): number {
  const t = solveTForX(cp, x, options);
  return evaluateY(cp, t);
}
