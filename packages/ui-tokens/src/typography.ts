/**
 * Typography tokens
 *
 * Font families sourced from Google Fonts.
 * Primary: Inter — clean, professional UI font
 * Mono: JetBrains Mono — for numeric readouts and code
 */

export const fontFamily = {
  sans: "'Inter', 'Inter fallback', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
} as const;

export const fontSize = {
  '2xs': '10px',
  xs: '11px',
  sm: '12px',
  md: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '30px',
  '5xl': '36px',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: '1.2',
  snug: '1.35',
  normal: '1.5',
  relaxed: '1.625',
} as const;

export const letterSpacing = {
  tight: '-0.02em',
  normal: '0em',
  wide: '0.04em',
  widest: '0.08em',
} as const;
