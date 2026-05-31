/**
 * @module velocity
 *
 * Velocity and tangent calculations for cubic Bézier curves.
 *
 * ## Vocabulary
 *
 * For a parametric curve B(t):
 *
 * - **Velocity vector** = B′(t): the tangent direction scaled by speed.
 *   Its x and y components are the rates of change of position per unit t.
 *
 * - **Speed** = |B′(t)|: the scalar magnitude — how fast the curve parameter
 *   moves through space as t increases.
 *
 * - **Unit tangent** T̂(t) = B′(t) / |B′(t)|: direction only, no magnitude.
 *   Undefined at cusps (where speed = 0).
 *
 * ## Easing velocity (dy/dx)
 *
 * For easing curves where x represents time and y represents value, the
 * "velocity" a user sees is dy/dx (change of value per unit time), not |B′(t)|.
 * This is computed via the chain rule:
 *
 *   dy/dx = (dy/dt) / (dx/dt) = B′y(t) / B′x(t)
 *
 * `easingVelocity` computes this for a given x input.
 */

import { evaluateDerivative, solveTForX } from './evaluate.ts';
import type { ControlPoints, Point2D, SolverOptions, VelocitySample } from './types.ts';

// ─── Internal helper ───────────────────────────────────────────────────────────

/** Normalize a 2D vector to unit length. Returns null for zero-length vectors. */
function normalize2D(v: Point2D): Point2D | null {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-10) return null;
  return { x: v.x / len, y: v.y / len };
}

// ─── Point-wise velocity ───────────────────────────────────────────────────────

/**
 * Compute the velocity vector B′(t) at parameter t.
 *
 * This is the first derivative of the curve — a vector tangent to the
 * curve with magnitude equal to the instantaneous speed.
 *
 * Identical to `evaluateDerivative` from the evaluate module, but exposed
 * here with velocity-domain terminology for clarity at call sites.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Velocity vector B′(t)
 *
 * @example
 * // Constant-velocity straight line
 * const linear: ControlPoints = [
 *   { x: 0, y: 0 }, { x: 1/3, y: 1/3 },
 *   { x: 2/3, y: 2/3 }, { x: 1, y: 1 },
 * ];
 * velocityAtT(linear, 0.5); // → { x: 1, y: 1 }
 */
export function velocityAtT(cp: ControlPoints, t: number): Point2D {
  return evaluateDerivative(cp, t);
}

/**
 * Compute the scalar speed |B′(t)| at parameter t.
 *
 * Speed is the Euclidean magnitude of the velocity vector:
 *
 *   speed(t) = √[(B′x(t))² + (B′y(t))²]
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Non-negative scalar speed
 *
 * @example
 * // Ease-in: slow start, accelerating through the curve
 * speedAtT(easeIn, 0);    // → small value (slow at start)
 * speedAtT(easeIn, 1);    // → large value (fast at end)
 */
export function speedAtT(cp: ControlPoints, t: number): number {
  const v = evaluateDerivative(cp, t);
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Compute the unit tangent vector T̂(t) at parameter t.
 *
 * T̂(t) = B′(t) / |B′(t)|
 *
 * The tangent vector has unit length and points in the direction of
 * increasing t along the curve.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Unit tangent, or null at cusps where |B′(t)| = 0
 *
 * @example
 * // 45° straight line — tangent always points diagonally
 * tangentAtT(linear, 0.5); // → { x: 0.707, y: 0.707 }
 */
export function tangentAtT(cp: ControlPoints, t: number): Point2D | null {
  const v = evaluateDerivative(cp, t);
  return normalize2D(v);
}

// ─── Easing velocity ───────────────────────────────────────────────────────────

/**
 * Compute the easing velocity dy/dx at a given normalized time x.
 *
 * For a curve used as an easing function (x = time, y = value), the
 * perceptible "speed" is the rate of change of y with respect to x:
 *
 *   dy/dx = B′y(t) / B′x(t)
 *
 * This is computed via the chain rule — find t for x, then divide the
 * y-component of the derivative by the x-component.
 *
 * **Prerequisite**: Bx must be monotonically increasing (B′x(t) > 0).
 * Returns Infinity when B′x(t) = 0 (vertical tangent — instantaneous change).
 *
 * @param cp      - Control points, typically P0=(0,0), P3=(1,1)
 * @param x       - Normalized time, x ∈ [0, 1]
 * @param options - Newton-Raphson solver options
 * @returns       dy/dx — rate of value change per unit time
 *
 * @example
 * // ease-in: slow start (low dy/dx at x≈0), fast end (high dy/dx at x≈1)
 * easingVelocity(easeIn, 0.1);  // small value
 * easingVelocity(easeIn, 0.9);  // large value
 */
export function easingVelocity(
  cp: ControlPoints,
  x: number,
  options?: SolverOptions,
): number {
  const t = solveTForX(cp, x, options);
  const d = evaluateDerivative(cp, t);
  if (Math.abs(d.x) < 1e-10) return Infinity;
  return d.y / d.x;
}

// ─── Curve sampling ────────────────────────────────────────────────────────────

/**
 * Compute velocity information at `count` uniformly-spaced t values.
 *
 * Returns an array of VelocitySample objects, each containing the
 * velocity vector, scalar speed, and unit tangent at that t.
 *
 * Useful for plotting speed graphs and visualizing motion dynamics.
 *
 * @param cp    - Control points [P0, P1, P2, P3]
 * @param count - Number of samples (must be ≥ 2)
 * @returns     Array of VelocitySample, length = count
 *
 * @example
 * const samples = velocityCurve(easeInOut, 100);
 * const maxSpeed = Math.max(...samples.map(s => s.speed));
 */
export function velocityCurve(cp: ControlPoints, count = 100): VelocitySample[] {
  if (count < 2) throw new RangeError(`count must be ≥ 2, got ${count}`);

  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const velocity = evaluateDerivative(cp, t);
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const tangent = normalize2D(velocity);
    return { t, velocity, speed, tangent };
  });
}
