/**
 * Local types for the web-editor app.
 * Core geometric types (Point2D, ControlPoints) are imported from curve-engine.
 */

import type { Point2D } from '@ae-motion-tools/curve-engine';

/** A named Bézier preset — only P1 and P2 are stored since P0=(0,0) and P3=(1,1) are fixed. */
export interface Preset {
  id: string;
  name: string;
  /** Control handle 1 (influences start tangent) */
  p1: Point2D;
  /** Control handle 2 (influences end tangent) */
  p2: Point2D;
}
