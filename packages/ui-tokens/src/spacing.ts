/**
 * Spacing tokens
 *
 * 4px base unit system. All spacing values are multiples of 4px.
 * This ensures mathematical consistency across layouts.
 */

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const;

export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  modal: 200,
  tooltip: 300,
  toast: 400,
} as const;

/** Shadow tokens */
export const shadow = {
  sm: '0 1px 3px hsl(224 15% 4% / 0.4)',
  md: '0 4px 12px hsl(224 15% 4% / 0.5)',
  lg: '0 8px 24px hsl(224 15% 4% / 0.6)',
  glow: '0 0 20px hsl(258 90% 66% / 0.3)',
} as const;
