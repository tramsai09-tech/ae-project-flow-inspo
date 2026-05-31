import type { Preset } from '../types.ts';

// ── Built-in presets ───────────────────────────────────────────────────────────

export const PRESETS: Preset[] = [
  { id: 'linear',      name: 'Linear',      p1: { x: 0,    y: 0    }, p2: { x: 1,     y: 1    } },
  { id: 'ease',        name: 'Ease',        p1: { x: 0.25, y: 0.1  }, p2: { x: 0.25,  y: 1    } },
  { id: 'ease-in',     name: 'Ease In',     p1: { x: 0.42, y: 0    }, p2: { x: 1,     y: 1    } },
  { id: 'ease-out',    name: 'Ease Out',    p1: { x: 0,    y: 0    }, p2: { x: 0.58,  y: 1    } },
  { id: 'ease-io',     name: 'Ease In-Out', p1: { x: 0.42, y: 0    }, p2: { x: 0.58,  y: 1    } },
  { id: 'spring',      name: 'Spring',      p1: { x: 0.68, y:-0.55 }, p2: { x: 0.265, y: 1.55 } },
  { id: 'back-in',     name: 'Back In',     p1: { x: 0.6,  y:-0.28 }, p2: { x: 0.735, y: 1.35 } },
  { id: 'sharp',       name: 'Sharp',       p1: { x: 0.4,  y: 0    }, p2: { x: 1,     y: 1    } },
];

// ── Mini curve preview (inline SVG per button) ─────────────────────────────────

const PW = 58;   // preview SVG width
const PH = 38;   // preview SVG height
const PP = 6;    // padding inside preview SVG

function miniX(x: number) { return PP + x * (PW - 2 * PP); }
function miniY(y: number) { return (PH - PP) - y * (PH - 2 * PP); }

function MiniCurve({ preset }: { preset: Preset }) {
  const { p1, p2 } = preset;
  const d = [
    `M ${miniX(0)} ${miniY(0)}`,
    `C ${miniX(p1.x)} ${miniY(p1.y)}`,
    `  ${miniX(p2.x)} ${miniY(p2.y)}`,
    `  ${miniX(1)} ${miniY(1)}`,
  ].join(' ');

  return (
    <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} aria-hidden>
      {/* Container */}
      <rect x={PP} y={PP} width={PW - 2 * PP} height={PH - 2 * PP}
        fill="hsl(224 14% 12%)" rx="2" />
      {/* Diagonal reference */}
      <line
        x1={miniX(0)} y1={miniY(0)} x2={miniX(1)} y2={miniY(1)}
        stroke="hsl(224 8% 22%)" strokeWidth="0.5"
      />
      {/* Curve */}
      <path d={d} fill="none" stroke="hsl(258 90% 66%)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface PresetPanelProps {
  onApply: (preset: Preset) => void;
}

export function PresetPanel({ onApply }: PresetPanelProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Presets</span>
      </div>

      <div className="preset-grid">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className="preset-btn"
            onClick={() => onApply(preset)}
            title={`Apply ${preset.name} preset`}
          >
            <MiniCurve preset={preset} />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
