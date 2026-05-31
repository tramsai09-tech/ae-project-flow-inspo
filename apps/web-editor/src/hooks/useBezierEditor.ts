import { useCallback, useState } from 'react';
import type { ControlPoints, Point2D } from '@ae-motion-tools/curve-engine';
import type { Preset } from '../types.ts';

/** Ease-in-out (CSS default) as the editor's starting state */
const DEFAULT_POINTS: ControlPoints = [
  { x: 0,    y: 0 },   // P0 — fixed start anchor
  { x: 0.42, y: 0 },   // P1 — draggable handle
  { x: 0.58, y: 1 },   // P2 — draggable handle
  { x: 1,    y: 1 },   // P3 — fixed end anchor
];

export interface BezierEditorState {
  controlPoints: ControlPoints;
  /** Update a draggable handle (only indices 1 and 2 are mutable) */
  updateHandle: (index: 1 | 2, point: Point2D) => void;
  /** Apply a named preset */
  applyPreset: (preset: Preset) => void;
  /** Reset to the default ease-in-out */
  reset: () => void;
}

/**
 * Manages the control-point state for the Bézier editor.
 *
 * P0 = (0, 0) and P3 = (1, 1) are permanently fixed so the curve is always
 * valid as a CSS `cubic-bezier` easing function. Only P1 (index 1) and
 * P2 (index 2) are user-editable.
 */
export function useBezierEditor(): BezierEditorState {
  const [controlPoints, setControlPoints] = useState<ControlPoints>([...DEFAULT_POINTS]);

  const updateHandle = useCallback((index: 1 | 2, point: Point2D) => {
    setControlPoints((prev) => {
      // Clamp x to [0, 1] to keep CSS cubic-bezier x-values valid.
      // y is intentionally unclamped to allow overshoot / spring effects.
      const clamped: Point2D = {
        x: Math.max(0, Math.min(1, point.x)),
        y: point.y,
      };
      return index === 1
        ? [prev[0], clamped, prev[2], prev[3]]
        : [prev[0], prev[1], clamped, prev[3]];
    });
  }, []);

  const applyPreset = useCallback((preset: Preset) => {
    setControlPoints([
      { x: 0, y: 0 },
      { ...preset.p1 },
      { ...preset.p2 },
      { x: 1, y: 1 },
    ]);
  }, []);

  const reset = useCallback(() => {
    setControlPoints([...DEFAULT_POINTS]);
  }, []);

  return { controlPoints, updateHandle, applyPreset, reset };
}
