import React from 'react';

interface SquarePreviewProps {
  progress: number;
  easedValue: number;
}

export function SquarePreview({ progress, easedValue }: SquarePreviewProps) {
  return (
    <div className="square-preview-stage">
      <div className="square-track-container">
        <div className="square-track">
          <div 
            className="animated-square"
            style={{ 
              transform: `translateX(calc(${easedValue} * var(--track-travel, 220px)))` 
            }}
          />
        </div>
      </div>
      <div className="square-labels">
        <span className="label-start">Start</span>
        <span className="label-end">End</span>
      </div>
    </div>
  );
}
