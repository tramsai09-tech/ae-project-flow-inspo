import { useEffect, useRef, useState } from 'react';
import { evaluateEasing } from '@ae-motion-tools/curve-engine';
import type { ControlPoints } from '@ae-motion-tools/curve-engine';

// ── Preview SVG constants ──────────────────────────────────────────────────────

const PV_W   = 280;   // viewBox width
const PV_H   = 96;    // viewBox height
const PV_PAD = 12;    // padding
const PV_IW  = PV_W - 2 * PV_PAD;
const PV_IH  = PV_H - 2 * PV_PAD;
const BALL_R = 5;
const ANIM_MS = 1600;

const toPreviewX = (x: number) => PV_PAD + x * PV_IW;
const toPreviewY = (y: number) => PV_H - PV_PAD - y * PV_IH;

// ── Mini curve path for preview ────────────────────────────────────────────────

function previewPath(cp: ControlPoints) {
  const [p0, p1, p2, p3] = cp;
  return [
    `M ${toPreviewX(p0.x)} ${toPreviewY(p0.y)}`,
    `C ${toPreviewX(p1.x)} ${toPreviewY(p1.y)}`,
    `  ${toPreviewX(p2.x)} ${toPreviewY(p2.y)}`,
    `  ${toPreviewX(p3.x)} ${toPreviewY(p3.y)}`,
  ].join(' ');
}

// ── Component ──────────────────────────────────────────────────────────────────

interface AnimationPreviewProps {
  controlPoints: ControlPoints;
}

export function AnimationPreview({ controlPoints }: AnimationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);  // linear time ∈ [0, 1]
  const rafRef     = useRef<number>(0);
  const startRef   = useRef<number>(0);

  // RAF animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const tick = (timestamp: number) => {
      if (startRef.current === 0) startRef.current = timestamp;
      const t = Math.min((timestamp - startRef.current) / ANIM_MS, 1);
      setProgress(t);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Pause briefly at end then reset
        const timer = setTimeout(() => {
          setIsPlaying(false);
          setProgress(0);
        }, 350);
        return () => clearTimeout(timer);
      }
    };

    startRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  // Eased y value at current linear time
  const easedY = isPlaying
    ? Math.max(-0.2, Math.min(1.2, evaluateEasing(controlPoints, progress)))
    : 0;

  // Ball position in preview SVG: x moves at linear speed, y = eased value
  const ballX = toPreviewX(progress);
  const ballY = toPreviewY(easedY);

  // Ghost trail: draw the locus of the ball as a short dashed line from (0,0) to current pos
  const curvePath = previewPath(controlPoints);

  const handlePlay = () => {
    if (isPlaying) return;
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Motion Preview</span>
      </div>

      <div className="preview-body">
        {/* Progress track */}
        <div className="preview-track-container">
          <div
            className="preview-track-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* SVG preview area — shows the curve with the moving dot */}
        <div className="preview-svg-area">
          <svg
            viewBox={`0 0 ${PV_W} ${PV_H}`}
            width="100%"
            style={{ display: 'block' }}
            aria-label="Animation preview"
          >
            <defs>
              <radialGradient id="ap-ball-grad" cx="35%" cy="35%">
                <stop offset="0%"   stopColor="hsl(258 100% 85%)" />
                <stop offset="100%" stopColor="hsl(258 90% 55%)" />
              </radialGradient>
              <filter id="ap-ball-glow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect width={PV_W} height={PV_H} fill="hsl(224 16% 9%)" />

            {/* Unit-box boundary */}
            <rect
              x={PV_PAD} y={PV_PAD}
              width={PV_IW} height={PV_IH}
              fill="none"
              stroke="hsl(224 8% 18%)"
              strokeWidth="0.5"
            />

            {/* Diagonal reference */}
            <line
              x1={toPreviewX(0)} y1={toPreviewY(0)}
              x2={toPreviewX(1)} y2={toPreviewY(1)}
              stroke="hsl(224 8% 22%)"
              strokeWidth="0.5"
              strokeDasharray="4 3"
            />

            {/* Bézier curve (static) */}
            <path
              d={curvePath}
              fill="none"
              stroke="hsl(258 90% 66%)"
              strokeWidth="1.5"
              opacity="0.35"
              strokeLinecap="round"
            />

            {/* Animated curve trail (drawn up to current progress) */}
            {isPlaying && (
              <path
                d={curvePath}
                fill="none"
                stroke="url(#ap-grad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${progress * (PV_IW + PV_IH)} 9999`}
                opacity="0.7"
              />
            )}

            {/* Vertical cursor (linear time marker) */}
            {isPlaying && (
              <line
                x1={ballX} y1={PV_PAD}
                x2={ballX} y2={PV_H - PV_PAD}
                stroke="hsl(258 90% 66%)"
                strokeWidth="0.75"
                opacity="0.25"
              />
            )}

            {/* Animated ball */}
            {isPlaying && (
              <>
                {/* Glow */}
                <circle
                  cx={ballX} cy={ballY} r={BALL_R + 4}
                  fill="hsl(258 90% 66%)"
                  opacity="0.12"
                />
                {/* Ball */}
                <circle
                  cx={ballX} cy={ballY} r={BALL_R}
                  fill="url(#ap-ball-grad)"
                  filter="url(#ap-ball-glow)"
                />
              </>
            )}

            {/* Start / end dots */}
            <circle cx={toPreviewX(0)} cy={toPreviewY(0)} r={2.5} fill="hsl(192 85% 55%)" />
            <circle cx={toPreviewX(1)} cy={toPreviewY(1)} r={2.5} fill="hsl(192 85% 55%)" />

            {/* Axis labels */}
            <text
              x={toPreviewX(0.5)} y={PV_H - 1}
              textAnchor="middle"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, fill: 'hsl(220 8% 30%)' } as React.CSSProperties}
            >
              time →
            </text>
          </svg>
        </div>

        {/* Play button */}
        <div className="preview-actions">
          <button
            id="preview-play-btn"
            className="play-btn"
            onClick={handlePlay}
            disabled={isPlaying}
            aria-label="Play animation preview"
          >
            {isPlaying ? (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
                  <rect x="1" y="1" width="3" height="8" rx="1" />
                  <rect x="6" y="1" width="3" height="8" rx="1" />
                </svg>
                Playing…
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
                  <polygon points="2,1 9,5 2,9" />
                </svg>
                Play
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
