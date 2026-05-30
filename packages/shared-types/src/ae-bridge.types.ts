/**
 * After Effects bridge type definitions
 *
 * These types describe the data contract between the browser app
 * and the Adobe CEP / ExtendScript layer.
 */

// ── Connection ────────────────────────────────────────────────────────────────

export type AEConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface AEConnectionInfo {
  readonly status: AEConnectionStatus;
  readonly aeVersion?: string;
  readonly errorMessage?: string;
}

// ── AE keyframe representation ────────────────────────────────────────────────

/**
 * After Effects expresses temporal easing via influence (%) and speed,
 * not raw Bézier handle positions. The ae-serializer converts between formats.
 */
export interface AEKeyframeEase {
  /** Incoming influence (0–100) */
  readonly influenceIn: number;
  /** Outgoing influence (0–100) */
  readonly influenceOut: number;
  /** Incoming speed */
  readonly speedIn: number;
  /** Outgoing speed */
  readonly speedOut: number;
}

export interface AEKeyframe {
  readonly time: number; // In seconds
  readonly value: number;
  readonly ease: AEKeyframeEase;
}

// ── Bridge messages ───────────────────────────────────────────────────────────

export type AEBridgeMessageType =
  | 'APPLY_CURVE'
  | 'GET_SELECTED_PROPERTY'
  | 'PING'
  | 'PONG';

export interface AEBridgeMessage<T = unknown> {
  readonly type: AEBridgeMessageType;
  readonly payload: T;
  readonly requestId: string;
}

// ── Export record ─────────────────────────────────────────────────────────────

export interface AEExportRecord {
  readonly curveId: string;
  readonly exportedAt: number;
  readonly targetProperty?: string;
  readonly keyframes: readonly AEKeyframe[];
}
