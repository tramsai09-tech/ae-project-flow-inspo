/**
 * @ae-motion-tools/bezier-core
 *
 * Zero-dependency cubic Bézier math kernel.
 *
 * ARCHITECTURE RULE: This package must never import React, DOM APIs,
 * Zustand, or any @ae-motion-tools/ui-* package. It must be usable in
 * Web Workers, Node.js, and AI service environments without modification.
 *
 * Phase 1 implementation will add:
 *   - BezierMath      (de Casteljau algorithm, LUT generation)
 *   - BezierCurve     (curve factory and mutation helpers)
 *   - Interpolator    (t → value sampling from LUT)
 *   - Validator       (monotonicity, bounds checks)
 *   - EasingPresets   (standard easing constant definitions)
 */

// Placeholder — exports will be added in Phase 1
export {};
