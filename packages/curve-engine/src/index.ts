/**
 * @ae-motion-tools/curve-engine
 *
 * Pure TypeScript cubic Bézier engine.
 *
 * ## Modules
 *
 * - **evaluate** — Core point, derivative, and easing evaluation
 * - **sample**   — Uniform and arc-length curve sampling, LUT generation
 * - **velocity** — Speed, tangent, and easing velocity (dy/dx)
 * - **acceleration** — Acceleration, curvature, normal vector
 * - **normalize** — Bounding box, normalization, handle clamping
 *
 * ## Quick start
 *
 * ```ts
 * import {
 *   evaluateEasing,
 *   sampleCurve,
 *   speedAtT,
 *   curvatureAtT,
 *   normalizeCurve,
 * } from '@ae-motion-tools/curve-engine';
 *
 * // CSS ease-in-out: cubic-bezier(0.42, 0, 0.58, 1)
 * const cp: ControlPoints = [
 *   { x: 0, y: 0 }, { x: 0.42, y: 0 },
 *   { x: 0.58, y: 1 }, { x: 1, y: 1 },
 * ];
 *
 * // Get the eased value at 30% through the animation
 * const y = evaluateEasing(cp, 0.3); // → ~0.16
 *
 * // Sample 60 points for rendering
 * const points = sampleCurve(cp, { count: 60 });
 *
 * // Speed profile (useful for motion analysis)
 * const speed = speedAtT(cp, 0.5); // → scalar
 * ```
 *
 * @packageDocumentation
 */

// ── Core types ────────────────────────────────────────────────────────────────
export type {
  AccelerationSample,
  BoundingBox,
  ControlPoints,
  CurveExtrema,
  CurveSample,
  LUTEntry,
  Point2D,
  SamplingOptions,
  SolverOptions,
  VelocitySample,
} from './types.ts';

// ── Evaluation ────────────────────────────────────────────────────────────────
export {
  evaluateDerivative,
  evaluateDerivativeX,
  evaluateEasing,
  evaluatePoint,
  evaluateSecondDerivative,
  evaluateX,
  evaluateY,
  solveTForX,
} from './evaluate.ts';

// ── Sampling ──────────────────────────────────────────────────────────────────
export {
  arcLength,
  buildLUT,
  lookupY,
  parameterAtArcLength,
  sampleCurve,
  sampleCurveArcLength,
} from './sample.ts';

// ── Velocity ──────────────────────────────────────────────────────────────────
export {
  easingVelocity,
  speedAtT,
  tangentAtT,
  velocityAtT,
  velocityCurve,
} from './velocity.ts';

// ── Acceleration ──────────────────────────────────────────────────────────────
export {
  accelerationAtT,
  accelerationCurve,
  accelerationMagnitudeAtT,
  curvatureAtT,
  normalAtT,
  radiusOfCurvatureAtT,
} from './acceleration.ts';

// ── Normalization ─────────────────────────────────────────────────────────────
export {
  clampHandles,
  getBoundingBox,
  getCurveExtrema,
  isXMonotone,
  normalizeCurve,
  toPolyline,
} from './normalize.ts';
