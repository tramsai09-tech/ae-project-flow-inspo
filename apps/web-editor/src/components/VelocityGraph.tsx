import React, { useMemo } from 'react';
import type { ControlPoints } from '@ae-motion-tools/curve-engine';
import { velocityCurve } from '@ae-motion-tools/curve-engine';

interface VelocityGraphProps {
  controlPoints: ControlPoints;
}

const W = 280;
const H = 80;
const PAD = 10;
const IW = W - 2 * PAD;
const IH = H - 2 * PAD;

export function VelocityGraph({ controlPoints }: VelocityGraphProps) {
  // Generate curve samples (t from 0 to 1)
  const samples = useMemo(() => velocityCurve(controlPoints, 100), [controlPoints]);

  // Calculate velocity: For easing curves, the "velocity" over time (x-axis of curve) 
  // is dy/dx. So we plot x vs dy/dx.
  const points = useMemo(() => {
    return samples.map(s => {
      // Evaluate x position directly from Bernstein polynomial
      // We know evaluatePoint(cp, t).x gives the x position.
      // But we can approximate x by the curve definition, or just plot against t.
      // Easing graphs usually plot 'Time' (x) on horizontal and 'Velocity' (dy/dx) on vertical.
      // We will plot `t` as the parameter, but visually it acts as progress.
      const dx = s.velocity.x;
      const dy = s.velocity.y;
      
      let v = 0;
      if (Math.abs(dx) > 1e-6) {
        v = dy / dx;
      }
      return { t: s.t, v };
    });
  }, [samples]);

  const maxV = useMemo(() => {
    let max = 0.1;
    for (const p of points) if (Math.abs(p.v) > max) max = Math.abs(p.v);
    return max;
  }, [points]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => {
      const px = PAD + p.t * IW;
      // Normalize v to fit in the graph
      // If v is maxV, it's at PAD. If v is 0, it's at PAD + IH.
      const py = PAD + IH - (p.v / maxV) * IH;
      return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
    }).join(' ');
  }, [points, maxV]);

  const fillD = useMemo(() => {
    if (!pathD) return '';
    const lastX = PAD + IW;
    const baseLine = PAD + IH;
    return `${pathD} L ${lastX} ${baseLine} L ${PAD} ${baseLine} Z`;
  }, [pathD]);

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Velocity Graph (dy/dx)</span>
        <span className="panel-title" style={{ color: 'var(--text-4)' }}>Peak: {maxV.toFixed(1)}</span>
      </div>
      <div className="velocity-body" style={{ padding: '12px 14px' }}>
        <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="vel-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(192 85% 55% / 0.4)" />
                <stop offset="100%" stopColor="hsl(192 85% 55% / 0)" />
              </linearGradient>
            </defs>
            {/* Background */}
            <rect width={W} height={H} fill="transparent" />
            
            {/* Zero line */}
            <line x1={PAD} y1={PAD + IH} x2={W - PAD} y2={PAD + IH} stroke="hsl(224 8% 22%)" strokeWidth="1" strokeDasharray="2 2" />
            
            {/* Area fill */}
            <path d={fillD} fill="url(#vel-grad)" />
            
            {/* Line */}
            <path d={pathD} fill="none" stroke="hsl(192 85% 55%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
