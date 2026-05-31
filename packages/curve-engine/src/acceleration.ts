/**
 * @module acceleration
 *
 * Acceleration, curvature, and normal vector calculations for cubic Bézier curves.
 *
 * ## Vocabulary
 *
 * - **Acceleration vector** = B″(t): the second derivative of the curve.
 *   Describes how the velocity vector is changing — the "turning force".
 *
 * - **Acceleration magnitude** = |B″(t)|: scalar measure of how rapidly
 *   the curve is bending or speeding up.
 *
 * - **Curvature** κ(t): how sharply the curve bends per unit arc length.
 *   A straight line has κ = 0. Tighter turns have larger |κ|.
 *
 *   κ(t) = (B′x · B″y − B′y · B″x) / |B′(t)|³
 *
 *   The sign tells you which way the curve turns:
 *   - κ > 0 → turns counter-clockwise (left)
 *   - κ < 0 → turns clockwise (right)
 *
 * - **Unit normal** N̂(t): perpendicular to T̂, pointing toward the centre
 *   of curvature. Computed as T̂ rotated 90° in the sign direction of κ.
 *
 * ## Relationship to easing curves
 *
 * For easing curves (y = f(x)), large curvature near the start or end
 * indicates an "abrupt" easing transition that may feel mechanical.
 * The `accelerationCurve` output can be used to visualize and score
 * the smoothness of a motion design.
 */

import { evaluateDerivative, evaluateSecondDerivative } from './evaluate.ts';
import type { AccelerationSample, ControlPoints, Point2D } from './types.ts';

// ─── Internal helper ───────────────────────────────────────────────────────────

/** 2D cross product (scalar): a × b = ax·by − ay·bx */
function cross2D(a: Point2D, b: Point2D): number {
  return a.x * b.y - a.y * b.x;
}

/** Euclidean magnitude of a 2D vector */
function magnitude2D(v: Point2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

// ─── Point-wise acceleration ───────────────────────────────────────────────────

/**
 * Compute the acceleration vector B″(t) at parameter t.
 *
 * The second derivative of the parametric curve:
 *
 *   B″(t) = 6 · [(1−t)(P₂−2P₁+P₀) + t(P₃−2P₂+P₁)]
 *
 * This vector describes the rate of change of the velocity vector.
 * It is zero everywhere on a straight line, and largest near the endpoints
 * of a highly-curved segment.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Second derivative vector B″(t)
 *
 * @example
 * // Straight line — zero acceleration everywhere
 * accelerationAtT(linear, 0.5); // → { x: 0, y: 0 }
 */
export function accelerationAtT(cp: ControlPoints, t: number): Point2D {
  return evaluateSecondDerivative(cp, t);
}

/**
 * Compute the scalar acceleration magnitude |B″(t)| at parameter t.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Non-negative scalar acceleration magnitude
 */
export function accelerationMagnitudeAtT(cp: ControlPoints, t: number): number {
  const a = evaluateSecondDerivative(cp, t);
  return magnitude2D(a);
}

// ─── Curvature ─────────────────────────────────────────────────────────────────

/**
 * Compute the signed curvature κ(t) at parameter t.
 *
 * Curvature measures how sharply the curve bends per unit arc length:
 *
 *   κ(t) = (B′x·B″y − B′y·B″x) / |B′(t)|³
 *
 * Properties:
 *   - κ = 0 on straight segments
 *   - |κ| is large for tight turns, small for gentle turns
 *   - Sign: positive = CCW, negative = CW (standard math orientation)
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Signed curvature, or null when speed = 0 (curvature undefined)
 *
 * @example
 * curvatureAtT(linear, 0.5); // → 0 (no curvature)
 * curvatureAtT(circle, 0.5); // → 1/radius (constant for a circular arc)
 */
export function curvatureAtT(cp: ControlPoints, t: number): number | null {
  const d1 = evaluateDerivative(cp, t);
  const d2 = evaluateSecondDerivative(cp, t);
  const speed = magnitude2D(d1);

  // Curvature is undefined at cusps (zero-speed points)
  if (speed < 1e-10) return null;

  // κ = (B′ × B″) / |B′|³
  const crossProduct = cross2D(d1, d2);
  return crossProduct / (speed * speed * speed);
}

/**
 * Compute the radius of curvature ρ(t) = 1 / |κ(t)|.
 *
 * The radius of the osculating circle — the circle that best approximates
 * the curve at parameter t. Large radius = gentle turn; small radius = sharp turn.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Radius of curvature, or null when curvature is undefined or zero
 */
export function radiusOfCurvatureAtT(cp: ControlPoints, t: number): number | null {
  const kappa = curvatureAtT(cp, t);
  if (kappa === null) return null;
  const absKappa = Math.abs(kappa);
  if (absKappa < 1e-10) return null; // Straight — infinite radius
  return 1 / absKappa;
}

// ─── Normal vector ─────────────────────────────────────────────────────────────

/**
 * Compute the unit normal vector N̂(t) at parameter t.
 *
 * The normal is perpendicular to the tangent and points toward the
 * centre of curvature. It is computed by rotating the unit tangent 90°:
 *
 *   N̂(t) = (−T̂y, T̂x)   [rotated CCW when κ > 0]
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param t  - Curve parameter, t ∈ [0, 1]
 * @returns  Unit normal vector, or null when speed = 0
 *
 * @example
 * // At t=0.5 on a unit square quarter-arc, normal points to centre
 * normalAtT(quarterArc, 0.5); // → { x: -0.707, y: -0.707 }
 */
export function normalAtT(cp: ControlPoints, t: number): Point2D | null {
  const d1 = evaluateDerivative(cp, t);
  const speed = magnitude2D(d1);

  if (speed < 1e-10) return null;

  // Rotate tangent 90° CCW: (-y, x) / speed
  return {
    x: -d1.y / speed,
    y: d1.x / speed,
  };
}

// ─── Curve sampling ────────────────────────────────────────────────────────────

/**
 * Compute acceleration information at `count` uniformly-spaced t values.
 *
 * Returns an array of AccelerationSample objects containing the acceleration
 * vector, its magnitude, signed curvature, and unit normal at each t.
 *
 * Useful for:
 *   - Plotting acceleration / curvature profiles
 *   - Scoring motion smoothness (peaks in curvature = jarring transitions)
 *   - Detecting inflection points (where curvature changes sign)
 *
 * @param cp    - Control points [P0, P1, P2, P3]
 * @param count - Number of samples (must be ≥ 2)
 * @returns     Array of AccelerationSample, length = count
 *
 * @example
 * const samples = accelerationCurve(easeInOut, 100);
 * const inflections = samples.filter((s, i) =>
 *   i > 0 &&
 *   s.curvature !== null &&
 *   samples[i - 1]!.curvature !== null &&
 *   Math.sign(s.curvature!) !== Math.sign(samples[i - 1]!.curvature!)
 * );
 */
export function accelerationCurve(cp: ControlPoints, count = 100): AccelerationSample[] {
  if (count < 2) throw new RangeError(`count must be ≥ 2, got ${count}`);

  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const d1 = evaluateDerivative(cp, t);
    const d2 = evaluateSecondDerivative(cp, t);
    const acceleration = d2;
    const mag = magnitude2D(d2);
    const speed = magnitude2D(d1);

    let curvature: number | null = null;
    let normal: Point2D | null = null;

    if (speed >= 1e-10) {
      curvature = cross2D(d1, d2) / (speed * speed * speed);
      normal = { x: -d1.y / speed, y: d1.x / speed };
    }

    return {
      t,
      acceleration,
      magnitude: mag,
      curvature,
      normal,
    };
  });
}
