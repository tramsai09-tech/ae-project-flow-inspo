/**
 * Curve type definitions
 *
 * Represents a cubic Bézier curve in normalized [0, 1] space.
 * P0 is always (0, 0) — start anchor.
 * P3 is always (1, 1) — end anchor.
 * P1 and P2 are user-editable control handles.
 */

// ── Primitives ────────────────────────────────────────────────────────────────

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface HandlePair {
  readonly p1: Point2D; // Control handle 1 (near start anchor)
  readonly p2: Point2D; // Control handle 2 (near end anchor)
}

// ── Curve model ───────────────────────────────────────────────────────────────

export interface CurveMetadata {
  readonly name: string;
  readonly description?: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly createdAt: number; // Unix timestamp
  readonly updatedAt: number;
}

export interface CurveConstraints {
  /** Enforce that Y is monotonically increasing (prevents over/undershoot) */
  readonly monotonic: boolean;
  /** Clamp control handles to [0, 1] range */
  readonly clamped: boolean;
}

export interface CubicBezierCurve {
  readonly id: string;
  /** P0 — always (0, 0) */
  readonly p0: Point2D;
  /** P1 — first control handle */
  readonly p1: Point2D;
  /** P2 — second control handle */
  readonly p2: Point2D;
  /** P3 — always (1, 1) */
  readonly p3: Point2D;
  readonly metadata: CurveMetadata;
  readonly constraints: CurveConstraints;
}

// ── Editor state ──────────────────────────────────────────────────────────────

export type HandleId = 'p1' | 'p2';

export interface HandleSelection {
  readonly curveId: string;
  readonly handleId: HandleId;
}

export interface CurveBounds {
  readonly minY: number;
  readonly maxY: number;
}
