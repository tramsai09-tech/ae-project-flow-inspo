/**
 * @ae-motion-tools/ae-serializer
 *
 * Translates CubicBezierCurve data into After Effects keyframe format.
 *
 * After Effects uses a temporal easing model based on influence (%) and
 * speed rather than raw Bézier handle positions. This package owns that
 * conversion logic exclusively — no other package should contain it.
 *
 * Phase 4 implementation will add:
 *   - KeyframeSerializer   (CubicBezierCurve → AEKeyframe[])
 *   - EasingMapper         (Bézier handles → AE influence/speed values)
 *   - ExpressionGenerator  (generate AE JS expressions from curves)
 */

// Placeholder — exports will be added in Phase 4
export {};
