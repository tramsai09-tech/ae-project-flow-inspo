/**
 * Color tokens
 *
 * Curated dark-first color palette for AE Motion Tools.
 * HSL values chosen for mathematical harmony and theme scalability.
 *
 * Convention:
 *   - surface.*  → background layers (deepest to highest)
 *   - brand.*    → primary accent colors
 *   - semantic.* → functional colors (success, error, warning, info)
 *   - text.*     → text hierarchy
 *   - border.*   → dividers and outlines
 */

// ── Surface (background layers) ───────────────────────────────────────────────

export const surface = {
  /** App background — deepest layer */
  base: 'hsl(224, 15%, 8%)',
  /** Canvas background */
  canvas: 'hsl(224, 13%, 11%)',
  /** Panel / card background */
  panel: 'hsl(224, 12%, 14%)',
  /** Raised element (dropdown, popover) */
  elevated: 'hsl(224, 11%, 18%)',
  /** Interactive element default */
  interactive: 'hsl(224, 10%, 22%)',
  /** Interactive element hover */
  interactiveHover: 'hsl(224, 10%, 26%)',
} as const;

// ── Brand (accent) ────────────────────────────────────────────────────────────

export const brand = {
  /** Primary accent — electric violet */
  primary: 'hsl(258, 90%, 66%)',
  primaryHover: 'hsl(258, 90%, 72%)',
  primaryMuted: 'hsl(258, 50%, 30%)',
  /** Secondary accent — cyan */
  secondary: 'hsl(192, 85%, 55%)',
  secondaryMuted: 'hsl(192, 50%, 25%)',
} as const;

// ── Semantic ──────────────────────────────────────────────────────────────────

export const semantic = {
  success: 'hsl(145, 65%, 50%)',
  successMuted: 'hsl(145, 40%, 20%)',
  warning: 'hsl(38, 95%, 55%)',
  warningMuted: 'hsl(38, 60%, 20%)',
  error: 'hsl(4, 85%, 57%)',
  errorMuted: 'hsl(4, 50%, 22%)',
  info: 'hsl(210, 85%, 60%)',
  infoMuted: 'hsl(210, 50%, 22%)',
} as const;

// ── Text ──────────────────────────────────────────────────────────────────────

export const text = {
  primary: 'hsl(220, 20%, 95%)',
  secondary: 'hsl(220, 10%, 65%)',
  tertiary: 'hsl(220, 8%, 45%)',
  disabled: 'hsl(220, 6%, 30%)',
  inverse: 'hsl(224, 15%, 8%)',
} as const;

// ── Border ────────────────────────────────────────────────────────────────────

export const border = {
  subtle: 'hsl(224, 12%, 18%)',
  default: 'hsl(224, 10%, 24%)',
  strong: 'hsl(224, 8%, 35%)',
  focus: 'hsl(258, 90%, 66%)',
} as const;

// ── Curve editor specific ─────────────────────────────────────────────────────

export const curveEditor = {
  grid: 'hsl(224, 10%, 20%)',
  gridAxis: 'hsl(224, 10%, 28%)',
  curvePrimary: 'hsl(258, 90%, 66%)',
  curveSecondary: 'hsl(192, 85%, 55%)',
  handleFill: 'hsl(224, 13%, 11%)',
  handleStroke: 'hsl(258, 90%, 66%)',
  handleLine: 'hsl(258, 50%, 50%)',
  anchorFill: 'hsl(258, 90%, 66%)',
} as const;
