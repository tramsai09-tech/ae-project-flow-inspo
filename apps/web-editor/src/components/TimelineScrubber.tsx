import React from 'react';

interface TimelineScrubberProps {
  progress: number;
  onScrub: (progress: number) => void;
}

export function TimelineScrubber({ progress, onScrub }: TimelineScrubberProps) {
  return (
    <div className="timeline-scrubber">
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={progress}
        onChange={(e) => onScrub(parseFloat(e.target.value))}
        className="scrubber-input"
        aria-label="Scrub animation timeline"
      />
      <div className="scrubber-track">
        <div 
          className="scrubber-fill" 
          style={{ width: `${progress * 100}%` }} 
        />
      </div>
    </div>
  );
}
