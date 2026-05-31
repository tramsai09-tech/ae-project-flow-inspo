import type { Preset } from './types.ts';

export const STARTER_PRESETS: Preset[] = [
  {
    id: 'smooth-ease',
    name: 'Smooth Ease',
    p1: { x: 0.25, y: 0.1 },
    p2: { x: 0.25, y: 1 },
    isBuiltIn: true,
  },
  {
    id: 'fast-ease',
    name: 'Fast Ease',
    p1: { x: 0.1, y: 0.9 },
    p2: { x: 0.2, y: 1 },
    isBuiltIn: true,
  },
  {
    id: 'apple-ui',
    name: 'Apple UI',
    p1: { x: 0.32, y: 0.72 },
    p2: { x: 0, y: 1 },
    isBuiltIn: true,
  },
  {
    id: 'snappy-reel',
    name: 'Snappy Reel',
    p1: { x: 0.1, y: 1 },
    p2: { x: 0, y: 1 },
    isBuiltIn: true,
  },
  {
    id: 'elastic-pop',
    name: 'Elastic Pop',
    p1: { x: 0.4, y: 1.4 },
    p2: { x: 0.6, y: 1 },
    isBuiltIn: true,
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    p1: { x: 0.8, y: 0 },
    p2: { x: 0.2, y: 1 },
    isBuiltIn: true,
  },
];
