/**
 * Preset type definitions
 *
 * A CurvePreset is a named, categorized snapshot of a CubicBezierCurve
 * that can be applied to restore a known easing configuration.
 */

import type { HandlePair } from './curve.types';

// ── Preset categories ─────────────────────────────────────────────────────────

export type PresetCategory =
  | 'ease'
  | 'spring'
  | 'bounce'
  | 'overshoot'
  | 'custom'
  | 'ai-suggested';

// ── Preset model ──────────────────────────────────────────────────────────────

export interface CurvePreset {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly category: PresetCategory;
  readonly tags: readonly string[];
  /** The stored handle positions (P0 and P3 are implicit 0,0 / 1,1) */
  readonly handles: HandlePair;
  /** Source: 'builtin' presets ship with the app; 'user' are user-created */
  readonly source: 'builtin' | 'user';
  readonly createdAt: number;
}

// ── Preset store ──────────────────────────────────────────────────────────────

export interface PresetSearchQuery {
  readonly text: string;
  readonly category: PresetCategory | 'all';
}

export interface PresetExport {
  readonly version: '1.0';
  readonly exportedAt: number;
  readonly presets: readonly CurvePreset[];
}
