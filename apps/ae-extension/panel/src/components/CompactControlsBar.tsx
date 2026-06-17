import React from 'react';
import type { ControlPoints, Point2D } from '@ae-motion-tools/curve-engine';

interface CompactControlsBarProps {
  controlPoints: ControlPoints;
  updateHandle: (index: 1 | 2, point: Point2D) => void;
  onApply: () => void;
  onReset: () => void;
}

function fmt(n: number) {
  return n.toFixed(2);
}

export function CompactControlsBar({ controlPoints, updateHandle, onApply, onReset }: CompactControlsBarProps) {
  const p1 = controlPoints[1];
  const p2 = controlPoints[2];

  const handleInputChange = (index: 1 | 2, axis: 'x' | 'y', val: string) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return;

    const current = controlPoints[index];
    updateHandle(index, {
      ...current,
      [axis]: parsed,
    });
  };

  return (
    <div className="bottom-bar">
      {/* ── Left: Readout ── */}
      <div className="readout-section">
        <span className="readout-icon" title="Read Values">→)</span>
        <div className="readout-grid">
          <div className="readout-row">
            <span className="readout-label">P1 X:</span>
            <input
              type="number" step="0.01" value={fmt(p1.x)}
              onChange={(e) => handleInputChange(1, 'x', e.target.value)}
              className="readout-input"
            />
            <span className="readout-label ml">Y:</span>
            <input
              type="number" step="0.01" value={fmt(p1.y)}
              onChange={(e) => handleInputChange(1, 'y', e.target.value)}
              className="readout-input"
            />
          </div>
          <div className="readout-row">
            <span className="readout-label">P2 X:</span>
            <input
              type="number" step="0.01" value={fmt(p2.x)}
              onChange={(e) => handleInputChange(2, 'x', e.target.value)}
              className="readout-input"
            />
            <span className="readout-label ml">Y:</span>
            <input
              type="number" step="0.01" value={fmt(p2.y)}
              onChange={(e) => handleInputChange(2, 'y', e.target.value)}
              className="readout-input"
            />
          </div>
        </div>
        <button className="bar-btn" title="Save as Favorite">★</button>
      </div>

      {/* ── Center: Direction Controls ── */}
      <div className="direction-controls">
        <button className="bar-btn" title="Apply to Left">←</button>
        <button className="bar-btn reset-btn" onClick={onReset} title="Reset">✕</button>
        <button className="bar-btn" title="Apply to Right">→</button>
      </div>

      {/* ── Right: Apply Button ── */}
      <button className="btn-apply" onClick={onApply}>
        APPLY
      </button>
    </div>
  );
}
