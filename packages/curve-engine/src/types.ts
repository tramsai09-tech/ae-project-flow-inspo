/**
 * @module types
 *
 * Core type definitions for the curve-engine package.
 *
 * All types are immutable (readonly) by default to ensure that curve data
 * is never accidentally mutated after construction. Functions that transform
 * a curve always return a new value.
 */

// ─── Primitives ────────────────────────────────────────────────────────────────

/**
 * A point in 2D space.
 */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/**
 * The four control points of a cubic Bézier curve.
 *
 * Convention used throughout this package:
 *   - cp[0] = P0 — start anchor
 *   - cp[1] = P1 — first control handle (influences start tangent)
 *   - cp[2] = P2 — second control handle (influences end tangent)
 *   - cp[3] = P3 — end anchor
 *
 * For standard easing curves, P0 = (0, 0) and P3 = (1, 1).
 */
export type ControlPoints = readonly [Point2D, Point2D, Point2D, Point2D];

// ─── Sampling ──────────────────────────────────────────────────────────────────

/**
 * A single sample of the curve at parameter t.
 */
export interface CurveSample {
  /** Curve parameter, t ∈ [0, 1] */
  readonly t: number;
  /** 2D position on the curve: B(t) */
  readonly point: Point2D;
  /** First derivative vector at t: B′(t) */
  readonly derivative: Point2D;
  /** Scalar speed (magnitude of the first derivative): |B′(t)| */
  readonly speed: number;
}

/**
 * One entry in a pre-computed lookup table for easing evaluation.
 * The LUT maps the parameter t to the (x, y) position on the curve.
 */
export interface LUTEntry {
  /** Curve parameter t ∈ [0, 1] */
  readonly t: number;
  /** Bx(t) — x-coordinate (usually represents normalized time) */
  readonly x: number;
  /** By(t) — y-coordinate (usually represents normalized value) */
  readonly y: number;
}

// ─── Bounding Box & Extrema ───────────────────────────────────────────────────

/**
 * The axis-aligned bounding box of a curve.
 */
export interface BoundingBox {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  /** Width of the bounding box (maxX - minX) */
  readonly width: number;
  /** Height of the bounding box (maxY - minY) */
  readonly height: number;
}

/**
 * The extreme points of a cubic Bézier curve — the local minima and maxima
 * in each axis. These are found where the first derivative is zero.
 */
export interface CurveExtrema {
  /** t values where B′x(t) = 0, i.e. x has a local extremum */
  readonly tExtremaX: readonly number[];
  /** t values where B′y(t) = 0, i.e. y has a local extremum */
  readonly tExtremaY: readonly number[];
  /** The x-coordinates at the extrema (including endpoints) */
  readonly extremeX: readonly number[];
  /** The y-coordinates at the extrema (including endpoints) */
  readonly extremeY: readonly number[];
}

// ─── Velocity ──────────────────────────────────────────────────────────────────

/**
 * Velocity information at a single parameter t.
 */
export interface VelocitySample {
  readonly t: number;
  /** B′(t) — the raw derivative vector (tangent direction × speed) */
  readonly velocity: Point2D;
  /** |B′(t)| — scalar speed along the curve */
  readonly speed: number;
  /**
   * Unit tangent vector T̂(t) = B′(t) / |B′(t)|.
   * Undefined when speed is zero (degenerate curve segment).
   */
  readonly tangent: Point2D | null;
}

// ─── Acceleration ──────────────────────────────────────────────────────────────

/**
 * Acceleration information at a single parameter t.
 */
export interface AccelerationSample {
  readonly t: number;
  /** B″(t) — the raw second-derivative vector */
  readonly acceleration: Point2D;
  /** |B″(t)| — scalar acceleration magnitude */
  readonly magnitude: number;
  /**
   * Signed curvature κ(t) = (B′x·B″y − B′y·B″x) / |B′(t)|³
   * Positive = curves left (CCW), negative = curves right (CW).
   * null when speed is zero (curvature is undefined).
   */
  readonly curvature: number | null;
  /**
   * Unit normal vector N̂(t), perpendicular to the tangent, pointing
   * toward the centre of curvature. null when speed is zero.
   */
  readonly normal: Point2D | null;
}

// ─── Options ───────────────────────────────────────────────────────────────────

/**
 * Options for curve sampling.
 */
export interface SamplingOptions {
  /**
   * Number of samples to generate (must be ≥ 2).
   * @default 100
   */
  readonly count?: number;
  /**
   * Sampling strategy.
   * - `'uniform'` — evenly-spaced t values in [0, 1] (fast, slightly bunched at extremes)
   * - `'arc-length'` — samples spaced evenly along the curve's arc length (slower, perceptually uniform)
   * @default 'uniform'
   */
  readonly method?: 'uniform' | 'arc-length';
}

/**
 * Options for the Newton-Raphson easing solver (solveTForX / evaluateEasing).
 */
export interface SolverOptions {
  /**
   * Convergence tolerance — stop when |Bx(t) - x| < epsilon.
   * @default 1e-7
   */
  readonly epsilon?: number;
  /**
   * Maximum Newton-Raphson iterations before falling back to bisection.
   * @default 12
   */
  readonly maxIterations?: number;
}
