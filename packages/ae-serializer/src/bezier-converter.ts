import type { AEKeyframeEase } from '@ae-motion-tools/shared-types/src/ae-bridge.types';

/**
 * Converts a standard CSS-style normalized Cubic Bezier (x1, y1, x2, y2)
 * to After Effects temporal keyframe easing (influence, speed).
 * 
 * @param x1 Bezier outgoing horizontal handle (0 to 1)
 * @param y1 Bezier outgoing vertical handle
 * @param x2 Bezier incoming horizontal handle (0 to 1)
 * @param y2 Bezier incoming vertical handle
 * @param dx Time difference between keyframes (seconds)
 * @param dy Value difference between keyframes (units)
 * @returns An AEKeyframeEase object with influenceIn/Out and speedIn/Out
 */
export function convertBezierToAeEase(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dx: number,
  dy: number
): AEKeyframeEase {
  // If keyframes are on the exact same frame, there is no meaningful curve.
  if (dx <= 0) {
    return {
      influenceOut: 0.1,
      speedOut: 0,
      influenceIn: 0.1,
      speedIn: 0,
    };
  }

  // Influence is defined as the percentage of the temporal duration (dx).
  // AE rigidly requires influence to be between 0.1% and 100%.
  // If x is exactly 0, AE will throw an error if passed 0%.
  const rawInfluenceOut = x1 * 100;
  const rawInfluenceIn = (1 - x2) * 100;
  
  const influenceOut = Math.max(0.1, Math.min(100, rawInfluenceOut));
  const influenceIn = Math.max(0.1, Math.min(100, rawInfluenceIn));

  // If there's no change in value, the actual physical speed of a curve
  // must be 0, regardless of the control point overshoot in the normalized space.
  // In a normalized space where dy=0, the vertical multiplier is 0.
  if (dy === 0) {
    return {
      influenceOut,
      speedOut: 0,
      influenceIn,
      speedIn: 0,
    };
  }

  // To calculate speed mathematically accurately, we must use the clamped 
  // horizontal bounds. This prevents division by zero and correctly scales
  // the slope if influence was clamped.
  const actualX1 = influenceOut / 100;
  const actualX2 = 1 - (influenceIn / 100);

  const averageSpeed = dy / dx;

  // Slope = (y / x) in the normalized space.
  // Speed = Slope * AverageSpeed in physical space.
  const speedOut = (y1 / actualX1) * averageSpeed;
  const speedIn = ((1 - y2) / (1 - actualX2)) * averageSpeed;

  return {
    influenceOut,
    speedOut,
    influenceIn,
    speedIn,
  };
}
