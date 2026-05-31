import { evaluateEasing } from '@ae-motion-tools/curve-engine';
import type { ControlPoints } from '@ae-motion-tools/curve-engine';
import { useAnimator } from '../hooks/useAnimator.ts';
import { PlaybackControls } from './PlaybackControls.tsx';
import { TimelineScrubber } from './TimelineScrubber.tsx';
import { SquarePreview } from './SquarePreview.tsx';

interface AnimationPreviewProps {
  controlPoints: ControlPoints;
}

export function AnimationPreview({ controlPoints }: AnimationPreviewProps) {
  const { isPlaying, progress, play, pause, restart, scrub } = useAnimator({ duration: 1600 });

  // Eased y value at current linear time
  const easedY = evaluateEasing(controlPoints, progress);

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Motion Preview</span>
      </div>

      <div className="preview-body">
        
        {/* Square Animation Stage */}
        <SquarePreview progress={progress} easedValue={easedY} />

        {/* Timeline Scrubber */}
        <TimelineScrubber progress={progress} onScrub={scrub} />

        {/* Playback Controls */}
        <PlaybackControls 
          isPlaying={isPlaying} 
          onPlay={play} 
          onPause={pause} 
          onRestart={restart} 
        />
        
      </div>
    </div>
  );
}
