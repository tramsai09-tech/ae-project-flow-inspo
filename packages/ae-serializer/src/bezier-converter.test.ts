import { describe, it, expect } from 'vitest';
import { convertBezierToAeEase } from './bezier-converter';

describe('convertBezierToAeEase', () => {
  it('converts a linear curve correctly', () => {
    // Linear is (0, 0, 1, 1) but usually represented as (0, 0, 1, 1) isn't strictly linear in CSS if handles are pulled out.
    // Let's use standard linear bezier control points: x1=0, y1=0, x2=1, y2=1 doesn't exist, wait.
    // CSS linear is linear keyword, equivalent to (0,0,1,1).
    const ease = convertBezierToAeEase(0, 0, 1, 1, 1, 100);
    
    // x1 = 0 -> influenceOut = 0.1 (clamped)
    // x2 = 1 -> influenceIn = 0.1 (clamped)
    // speedOut = 0 / 0.001 * 100 = 0
    // speedIn = (1 - 1) / 0.001 * 100 = 0
    expect(ease.influenceOut).toBeCloseTo(0.1);
    expect(ease.influenceIn).toBeCloseTo(0.1);
    expect(ease.speedOut).toBeCloseTo(0);
    expect(ease.speedIn).toBeCloseTo(0);
  });

  it('converts a standard ease correctly (e.g. 0.25, 0.1, 0.25, 1)', () => {
    const ease = convertBezierToAeEase(0.25, 0.1, 0.25, 1, 1, 100);
    // influenceOut = 25
    // influenceIn = (1 - 0.25) * 100 = 75
    // speedOut = (0.1 / 0.25) * 100 = 40
    // speedIn = ((1 - 1) / (1 - 0.25)) * 100 = 0
    expect(ease.influenceOut).toBe(25);
    expect(ease.influenceIn).toBe(75);
    expect(ease.speedOut).toBe(40);
    expect(ease.speedIn).toBe(0);
  });

  it('handles zero duration (dx = 0) without dividing by zero', () => {
    const ease = convertBezierToAeEase(0.25, 0.1, 0.25, 1, 0, 100);
    expect(ease.influenceOut).toBe(0.1);
    expect(ease.influenceIn).toBe(0.1);
    expect(ease.speedOut).toBe(0);
    expect(ease.speedIn).toBe(0);
  });

  it('handles zero delta value (dy = 0)', () => {
    // If dy = 0, average speed is 0. 
    // Even if there is an overshoot (y1=1.5), speed should be 0.
    const ease = convertBezierToAeEase(0.25, 1.5, 0.25, -0.5, 1, 0);
    expect(ease.influenceOut).toBe(25);
    expect(ease.influenceIn).toBe(75);
    expect(ease.speedOut).toBe(0);
    expect(ease.speedIn).toBe(0);
  });

  it('handles x = 0 without producing Infinity (the clone failure case)', () => {
    // x1 = 0, y1 = 1. dx = 1, dy = 100.
    // If we didn't clamp x, speedOut = (1 / 0) = Infinity
    const ease = convertBezierToAeEase(0, 1, 1, 0, 1, 100);
    
    // Clamped influence = 0.1% -> actualX1 = 0.001
    // speedOut = (1 / 0.001) * 100 = 100000
    expect(ease.influenceOut).toBe(0.1);
    expect(ease.influenceIn).toBe(0.1); // x2 = 1 -> 1-x2 = 0 -> clamped to 0.1
    expect(ease.speedOut).toBeCloseTo(100000);
    expect(ease.speedIn).toBeCloseTo(100000); // y2=0 -> (1-0)/0.001 * 100 = 100000
    
    // Check that they are finite numbers (not Infinity or NaN)
    expect(Number.isFinite(ease.speedOut)).toBe(true);
    expect(Number.isFinite(ease.speedIn)).toBe(true);
  });
});
