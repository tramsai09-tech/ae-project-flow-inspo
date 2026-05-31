import React from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
}

export function PlaybackControls({ isPlaying, onPlay, onPause, onRestart }: PlaybackControlsProps) {
  return (
    <div className="playback-controls">
      <button
        className="btn-icon"
        onClick={onRestart}
        title="Restart"
        aria-label="Restart animation"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      {isPlaying ? (
        <button
          className="play-btn"
          onClick={onPause}
          title="Pause"
          aria-label="Pause animation"
        >
          <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
            <rect x="1" y="1" width="3" height="8" rx="1" />
            <rect x="6" y="1" width="3" height="8" rx="1" />
          </svg>
          Pause
        </button>
      ) : (
        <button
          className="play-btn"
          onClick={onPlay}
          title="Play"
          aria-label="Play animation"
        >
          <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
            <polygon points="2,1 9,5 2,9" />
          </svg>
          Play
        </button>
      )}
    </div>
  );
}
