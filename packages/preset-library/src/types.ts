import type { Point2D } from '@ae-motion-tools/curve-engine';

export interface Preset {
  id: string;
  name: string;
  p1: Point2D;
  p2: Point2D;
  /** True if this is a built-in starter preset that cannot be deleted or overwritten. */
  isBuiltIn?: boolean;
}
