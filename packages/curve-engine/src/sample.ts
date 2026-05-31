/**
 * @module sample
 *
 * Curve sampling, lookup table (LUT) generation, and arc-length computation.
 *
 * ## Sampling strategies
 *
 * ### Uniform (parameter-space)
 * Samples are placed at evenly-spaced t values: t = 0, 1/(n−1), …, 1.
 * Fast to compute, but samples can cluster near areas of high curvature,
 * creating perceptually uneven spacing along the curve.
 *
 * ### Arc-length (distance-space)
 * Samples are placed such that each consecutive pair has the same distance
 * along the curve. Computed by:
 *   1. Building a fine cumulative arc-length table.
 *   2. Inverting it (binary search) to find t for each target arc-length.
 * Slower but gives perceptually uniform spacing — ideal for UI rendering.
 *
 * ## LUT (lookup table) for easing
 * A compact table of (t, x, y) entries used to quickly map x → y for
 * easing evaluation without running the full Newton-Raphson solver each frame.
 */

import {
  evaluatePoint,
  evaluateDerivative,
  evaluateX,
} from './evaluate.ts';
import type { ControlPoints, CurveSample, LUTEntry, SamplingOptions } from './types.ts';

// ─── Internal constants ────────────────────────────────────────────────────────

/** Default number of samples for sampleCurve */
const DEFAULT_SAMPLE_COUNT = 100;
/** Number of segments used internally for arc-length integration (Simpson's rule) */
const ARC_LENGTH_INTEGRATION_STEPS = 512;
/** Default LUT resolution (number of entries) */
const DEFAULT_LUT_RESOLUTION = 200;

// ─── Arc-length integration ────────────────────────────────────────────────────

/**
 * Compute the arc length of the curve segment from t0 to t1 using
 * composite Simpson's rule with `steps` subintervals.
 *
 * ∫_{t0}^{t1} |B′(t)| dt
 *
 * Simpson's rule gives 4th-order accuracy, making it far more efficient
 * than a simple trapezoidal approximation for the same step count.
 *
 * @internal
 */
function integrateArcLength(
  cp: ControlPoints,
  t0: number,
  t1: number,
  steps: number,
): number {
  // steps must be even for composite Simpson's rule
  const n = steps % 2 === 0 ? steps : steps + 1;
  const h = (t1 - t0) / n;

  let sum = 0;

  for (let i = 0; i <= n; i++) {
    const t = t0 + i * h;
    const d = evaluateDerivative(cp, t);
    const speed = Math.sqrt(d.x * d.x + d.y * d.y);

    // Simpson's coefficients: 1, 4, 2, 4, 2, …, 4, 1
    if (i === 0 || i === n) {
      sum += speed;
    } else if (i % 2 === 1) {
      sum += 4 * speed;
    } else {
      sum += 2 * speed;
    }
  }

  return (h / 3) * sum;
}

/**
 * Build a cumulative arc-length table — an array of (t, cumulativeLength) pairs.
 * Index 0 is always (0, 0); the last entry is (1, totalLength).
 *
 * @internal
 */
function buildArcLengthTable(
  cp: ControlPoints,
  steps: number,
): Array<{ t: number; len: number }> {
  const table: Array<{ t: number; len: number }> = [{ t: 0, len: 0 }];
  const dt = 1 / steps;
  let cumulative = 0;

  for (let i = 1; i <= steps; i++) {
    const t0 = (i - 1) * dt;
    const t1 = i * dt;
    // Integrate over a single small segment (6 sub-steps is accurate enough per segment)
    cumulative += integrateArcLength(cp, t0, t1, 6);
    table.push({ t: t1, len: cumulative });
  }

  return table;
}

/**
 * Given a cumulative arc-length table and a target arc-length `s`, find the
 * curve parameter t via binary search + linear interpolation.
 *
 * @internal
 */
function solveTPForArcLength(
  table: Array<{ t: number; len: number }>,
  targetLen: number,
): number {
  const totalLen = table[table.length - 1]!.len;

  if (targetLen <= 0) return 0;
  if (targetLen >= totalLen) return 1;

  let lo = 0;
  let hi = table.length - 1;

  // Binary search for the bracketing interval
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (table[mid]!.len < targetLen) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  // Linear interpolation between table[lo] and table[hi]
  const lenLo = table[lo]!.len;
  const lenHi = table[hi]!.len;
  const tLo = table[lo]!.t;
  const tHi = table[hi]!.t;

  const alpha = (lenHi - lenLo) > 0 ? (targetLen - lenLo) / (lenHi - lenLo) : 0;
  return tLo + alpha * (tHi - tLo);
}

// ─── Curve sampling ────────────────────────────────────────────────────────────

/**
 * Sample the Bézier curve at a set of t values.
 *
 * @internal — shared by sampleCurve and sampleCurveArcLength
 */
function sampleAtParameters(cp: ControlPoints, tValues: number[]): CurveSample[] {
  return tValues.map((t) => {
    const point = evaluatePoint(cp, t);
    const derivative = evaluateDerivative(cp, t);
    const speed = Math.sqrt(derivative.x * derivative.x + derivative.y * derivative.y);
    return { t, point, derivative, speed };
  });
}

/**
 * Sample the Bézier curve at `count` uniformly-spaced parameter values.
 *
 * Produces `count` samples with t = 0, 1/(count−1), …, 1.
 *
 * @param cp      - Control points [P0, P1, P2, P3]
 * @param options - Sampling options (count)
 * @returns       Array of CurveSample objects, length = count
 *
 * @example
 * const samples = sampleCurve(cp, { count: 5 });
 * // t values: 0, 0.25, 0.5, 0.75, 1
 */
export function sampleCurve(
  cp: ControlPoints,
  options: SamplingOptions = {},
): CurveSample[] {
  const count = options.count ?? DEFAULT_SAMPLE_COUNT;
  if (count < 2) throw new RangeError(`count must be ≥ 2, got ${count}`);

  const tValues = Array.from({ length: count }, (_, i) => i / (count - 1));
  return sampleAtParameters(cp, tValues);
}

/**
 * Sample the Bézier curve at `count` arc-length-uniform positions.
 *
 * Each consecutive pair of samples has (approximately) the same distance
 * along the curve. This is slower than `sampleCurve` but produces
 * perceptually even spacing — useful for rendering dots, dashes, etc.
 *
 * @param cp      - Control points [P0, P1, P2, P3]
 * @param options - Sampling options (count)
 * @returns       Array of CurveSample objects, arc-length evenly spaced
 *
 * @example
 * const samples = sampleCurveArcLength(cp, { count: 10 });
 * // Each sample is ~totalArcLength/9 apart from the previous one
 */
export function sampleCurveArcLength(
  cp: ControlPoints,
  options: SamplingOptions = {},
): CurveSample[] {
  const count = options.count ?? DEFAULT_SAMPLE_COUNT;
  if (count < 2) throw new RangeError(`count must be ≥ 2, got ${count}`);

  const table = buildArcLengthTable(cp, ARC_LENGTH_INTEGRATION_STEPS);
  const totalLen = table[table.length - 1]!.len;

  const tValues = Array.from({ length: count }, (_, i) => {
    const targetLen = (i / (count - 1)) * totalLen;
    return solveTPForArcLength(table, targetLen);
  });

  return sampleAtParameters(cp, tValues);
}

// ─── LUT (lookup table) ────────────────────────────────────────────────────────

/**
 * Build a lookup table (LUT) mapping curve parameter t to (x, y).
 *
 * The LUT contains `resolution + 1` entries for t = 0, 1/resolution, …, 1.
 * It is primarily used for fast easing evaluation via `lookupY`, avoiding
 * the Newton-Raphson solve on every animation frame.
 *
 * @param cp         - Control points [P0, P1, P2, P3]
 * @param resolution - Number of LUT intervals (entries = resolution + 1)
 * @returns          Pre-computed array of LUTEntry objects
 *
 * @example
 * const lut = buildLUT(cp, 200);
 * const y = lookupY(lut, 0.5); // fast approximate y at x=0.5
 */
export function buildLUT(
  cp: ControlPoints,
  resolution: number = DEFAULT_LUT_RESOLUTION,
): LUTEntry[] {
  if (resolution < 1) throw new RangeError(`resolution must be ≥ 1, got ${resolution}`);

  return Array.from({ length: resolution + 1 }, (_, i) => {
    const t = i / resolution;
    const point = evaluatePoint(cp, t);
    return { t, x: point.x, y: point.y };
  });
}

/**
 * Look up the y-value for a given x using a pre-built LUT.
 *
 * Uses binary search to find the bracketing entries, then linearly
 * interpolates between them. Accuracy depends on LUT resolution.
 *
 * For high-accuracy easing, use `evaluateEasing` from the evaluate module
 * (Newton-Raphson). This function trades accuracy for speed.
 *
 * @param lut - Pre-built lookup table from `buildLUT`
 * @param x   - Target x value (normalized time), x ∈ [0, 1]
 * @returns   Interpolated y value
 */
export function lookupY(lut: LUTEntry[], x: number): number {
  if (lut.length === 0) throw new Error('LUT is empty');
  if (x <= lut[0]!.x) return lut[0]!.y;
  if (x >= lut[lut.length - 1]!.x) return lut[lut.length - 1]!.y;

  // Binary search for bracketing interval
  let lo = 0;
  let hi = lut.length - 1;

  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (lut[mid]!.x < x) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const loEntry = lut[lo]!;
  const hiEntry = lut[hi]!;
  const xRange = hiEntry.x - loEntry.x;

  if (xRange < 1e-10) return loEntry.y;

  const alpha = (x - loEntry.x) / xRange;
  return loEntry.y + alpha * (hiEntry.y - loEntry.y);
}

// ─── Arc-length ────────────────────────────────────────────────────────────────

/**
 * Compute the arc length of the Bézier curve (or a segment of it).
 *
 * Integrates |B′(t)| from t0 to t1 using composite Simpson's rule.
 *
 * ∫_{t0}^{t1} √[(B′x(t))² + (B′y(t))²] dt
 *
 * @param cp   - Control points [P0, P1, P2, P3]
 * @param t0   - Start parameter (default: 0)
 * @param t1   - End parameter (default: 1)
 * @returns    Arc length of the curve segment [t0, t1]
 *
 * @example
 * arcLength(linear); // ≈ √2 for a diagonal unit curve
 * arcLength(cp, 0, 0.5); // half of the arc length
 */
export function arcLength(cp: ControlPoints, t0 = 0, t1 = 1): number {
  if (t0 < 0 || t0 > 1) throw new RangeError(`t0 must be in [0, 1], got ${t0}`);
  if (t1 < 0 || t1 > 1) throw new RangeError(`t1 must be in [0, 1], got ${t1}`);
  if (t0 >= t1) return 0;
  return integrateArcLength(cp, t0, t1, ARC_LENGTH_INTEGRATION_STEPS);
}

/**
 * Find the curve parameter t where the cumulative arc-length equals `s`.
 *
 * This is the arc-length parameterization — given a distance along the
 * curve, find the corresponding t.
 *
 * @param cp - Control points [P0, P1, P2, P3]
 * @param s  - Target arc-length (from 0 to totalArcLength)
 * @returns  Parameter t ∈ [0, 1]
 */
export function parameterAtArcLength(cp: ControlPoints, s: number): number {
  const table = buildArcLengthTable(cp, ARC_LENGTH_INTEGRATION_STEPS);
  return solveTPForArcLength(table, s);
}

/**
 * Get the x-coordinate of the Bézier curve at parameter t.
 * Re-exported from evaluate for convenience in this module's consumers.
 */
export { evaluateX };
