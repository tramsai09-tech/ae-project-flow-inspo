/**
 * BezierCanvas — SVG-based cubic Bézier editor.
 *
 * Coordinate systems
 * ──────────────────
 * Curve space:  (0,0) bottom-left → (1,1) top-right, y ↑
 * SVG space:    (0,0) top-left → (VSIZE, VSIZE) bottom-right, y ↓
 *
 * The unit square [0,1]×[0,1] in curve space is rendered at
 * SVG rect (ORIG_X, ORIG_Y − WORK) → (ORIG_X + WORK, ORIG_Y).
 *
 * Drag mechanics
 * ──────────────
 * onPointerDown on a handle → svgRef.setPointerCapture so events are
 * captured even when the mouse leaves the SVG.
 * onPointerMove on the SVG → convert clientX/Y → SVG coords → curve coords.
 */

import React, { useCallback, useRef, useState } from 'react';
import type { ControlPoints, Point2D } from '@ae-motion-tools/curve-engine';

// ── SVG layout constants ───────────────────────────────────────────────────────

const VSIZE  = 520;   // viewBox width & height (square)
const ORIG_X = 80;    // SVG x of curve-space origin (0,0)
const ORIG_Y = 440;   // SVG y of curve-space origin (0,0)
const WORK   = 360;   // unit-square side length in SVG pixels

// ── Coordinate conversion ──────────────────────────────────────────────────────

const toSVGX = (cx: number) => ORIG_X + cx * WORK;
const toSVGY = (cy: number) => ORIG_Y - cy * WORK;

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Background grid — major lines at 0.25, minor at 0.125 */
function Grid() {
  const major = [0, 0.25, 0.5, 0.75, 1];
  const minor = [0.125, 0.375, 0.625, 0.875];

  return (
    <g>
      {/* Unit-square background */}
      <rect
        x={ORIG_X} y={toSVGY(1)}
        width={WORK} height={WORK}
        fill="hsl(224 14% 10%)"
      />

      {/* Minor gridlines */}
      {minor.map((v) => (
        <g key={v}>
          <line
            x1={toSVGX(v)} y1={toSVGY(1) - 4}
            x2={toSVGX(v)} y2={toSVGY(0) + 4}
            stroke="hsl(224 8% 16%)" strokeWidth="0.5"
          />
          <line
            x1={toSVGX(0) - 4} y1={toSVGY(v)}
            x2={toSVGX(1) + 4} y2={toSVGY(v)}
            stroke="hsl(224 8% 16%)" strokeWidth="0.5"
          />
        </g>
      ))}

      {/* Major gridlines */}
      {major.map((v) => {
        const isEdge = v === 0 || v === 1;
        const stroke = isEdge ? 'hsl(224 8% 24%)' : 'hsl(224 8% 19%)';
        const w = isEdge ? 1 : 0.5;
        return (
          <g key={v}>
            <line
              x1={toSVGX(v)} y1={toSVGY(1.05)}
              x2={toSVGX(v)} y2={toSVGY(-0.05)}
              stroke={stroke} strokeWidth={w}
            />
            <line
              x1={toSVGX(-0.05)} y1={toSVGY(v)}
              x2={toSVGX(1.05)}  y2={toSVGY(v)}
              stroke={stroke} strokeWidth={w}
            />
          </g>
        );
      })}

      {/* Diagonal reference (linear = straight line) */}
      <line
        x1={ORIG_X} y1={ORIG_Y}
        x2={toSVGX(1)} y2={toSVGY(1)}
        stroke="hsl(224 8% 26%)"
        strokeWidth="0.75"
        strokeDasharray="5 4"
      />
    </g>
  );
}

/** Axis tick labels */
function AxisLabels() {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const style: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    fill: 'hsl(220 8% 36%)',
  } as unknown as React.CSSProperties;

  return (
    <g>
      {ticks.map((v) => (
        <g key={v}>
          {/* X axis */}
          <text
            x={toSVGX(v)} y={ORIG_Y + 18}
            textAnchor="middle"
            style={style}
          >
            {v}
          </text>
          {/* Y axis */}
          {v > 0 && (
            <text
              x={ORIG_X - 8} y={toSVGY(v)}
              textAnchor="end"
              dominantBaseline="middle"
              style={style}
            >
              {v}
            </text>
          )}
        </g>
      ))}

      {/* Axis labels */}
      <text
        x={ORIG_X + WORK / 2} y={VSIZE - 6}
        textAnchor="middle"
        style={{ ...style, fontSize: 10, fill: 'hsl(220 8% 28%)' } as unknown as React.CSSProperties}
      >
        Time →
      </text>
      <text
        x={14} y={ORIG_Y - WORK / 2}
        textAnchor="middle"
        transform={`rotate(-90 14 ${ORIG_Y - WORK / 2})`}
        style={{ ...style, fontSize: 10, fill: 'hsl(220 8% 28%)' } as unknown as React.CSSProperties}
      >
        Value ↑
      </text>
    </g>
  );
}

/** Diamond-shaped anchor marker for P0 and P3 */
function Anchor({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const s = 7;
  const pts = `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`;
  return (
    <g>
      <polygon points={pts} fill={color} opacity={0.15} transform={`scale(1.6) translate(${cx * (1 - 1 / 1.6)},${cy * (1 - 1 / 1.6)})`} />
      <polygon points={pts} fill={color} />
    </g>
  );
}

/** Draggable circular handle for P1 or P2 */
function Handle({
  cx, cy, isDragging, color, onPointerDown,
}: {
  cx: number;
  cy: number;
  isDragging: boolean;
  color: string;
  onPointerDown: (e: React.PointerEvent) => void;
}) {
  return (
    <g
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
    >
      {/* Halo (visible while dragging or on hover) */}
      <circle
        cx={cx} cy={cy} r={18}
        fill={color}
        opacity={isDragging ? 0.12 : 0}
        style={{ transition: 'opacity 100ms' }}
      />
      {/* Outer ring */}
      <circle
        cx={cx} cy={cy} r={8}
        fill="hsl(224 20% 7%)"
        stroke={color}
        strokeWidth={isDragging ? 2.5 : 2}
        style={{ transition: 'stroke-width 100ms' }}
      />
      {/* Inner dot */}
      <circle cx={cx} cy={cy} r={3} fill={color} />
    </g>
  );
}

/** Inline label showing (x, y) near a handle */
function HandleLabel({
  svgX, svgY, curveX, curveY, anchor,
}: {
  svgX: number; svgY: number;
  curveX: number; curveY: number;
  anchor: 'start' | 'end';
}) {
  const dx = anchor === 'start' ? 14 : -14;
  const dy = curveY > 0.5 ? 22 : -12;

  return (
    <text
      x={svgX + dx}
      y={svgY + dy}
      textAnchor={anchor}
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        fill: 'hsl(220 12% 60%)',
        pointerEvents: 'none',
      } as unknown as React.CSSProperties}
    >
      ({curveX.toFixed(2)}, {curveY.toFixed(2)})
    </text>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export interface BezierCanvasProps {
  controlPoints: ControlPoints;
  onPointChange: (index: 1 | 2, point: Point2D) => void;
}

export function BezierCanvas({ controlPoints, onPointChange }: BezierCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<1 | 2 | null>(null);

  const [p0, p1, p2, p3] = controlPoints;

  // Pre-compute SVG positions for all 4 points
  const p0s = { x: toSVGX(p0.x), y: toSVGY(p0.y) };
  const p1s = { x: toSVGX(p1.x), y: toSVGY(p1.y) };
  const p2s = { x: toSVGX(p2.x), y: toSVGY(p2.y) };
  const p3s = { x: toSVGX(p3.x), y: toSVGY(p3.y) };

  /** Convert screen coords → SVG local coords using the current transform matrix. */
  const clientToSVG = useCallback((clientX: number, clientY: number): Point2D => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const m = svgRef.current.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(m.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  /** Convert SVG coords → curve coords */
  const svgToCurve = useCallback((svgPt: Point2D): Point2D => ({
    x: (svgPt.x - ORIG_X) / WORK,
    y: (ORIG_Y - svgPt.y) / WORK,
  }), []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: 1 | 2) => {
      e.preventDefault();
      e.stopPropagation();
      // Capture on the SVG so pointermove fires on SVG even outside bounds.
      svgRef.current?.setPointerCapture(e.pointerId);
      setDragging(index);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging === null) return;
      const svgPt = clientToSVG(e.clientX, e.clientY);
      const curvePt = svgToCurve(svgPt);
      onPointChange(dragging, curvePt);
    },
    [dragging, clientToSVG, svgToCurve, onPointChange],
  );

  const handlePointerUp = useCallback(() => setDragging(null), []);

  // SVG cubic-bezier path using all 4 converted SVG points
  const curvePath = `M ${p0s.x} ${p0s.y} C ${p1s.x} ${p1s.y} ${p2s.x} ${p2s.y} ${p3s.x} ${p3s.y}`;

  // Label anchors: flip when handle is in right half
  const p1LabelAnchor: 'start' | 'end' = p1.x > 0.6 ? 'end' : 'start';
  const p2LabelAnchor: 'start' | 'end' = p2.x > 0.6 ? 'end' : 'start';

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VSIZE} ${VSIZE}`}
      width="100%"
      height="100%"
      style={{ display: 'block', touchAction: 'none', userSelect: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Cubic Bézier curve editor canvas"
    >
      <defs>
        {/* Gradient along the curve (cyan → violet) */}
        <linearGradient id="ce-curve-grad" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="hsl(192 85% 55%)" />
          <stop offset="100%" stopColor="hsl(258 90% 66%)" />
        </linearGradient>

        {/* Soft glow behind the curve */}
        <filter id="ce-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Background ─────────────────────────────────────────────────────── */}
      <rect width={VSIZE} height={VSIZE} fill="hsl(224 20% 7%)" />

      {/* ── Grid + axes ────────────────────────────────────────────────────── */}
      <Grid />
      <AxisLabels />

      {/* ── Control arms (dashed lines from anchors to handles) ─────────────── */}
      <line
        x1={p0s.x} y1={p0s.y} x2={p1s.x} y2={p1s.y}
        stroke="hsl(258 50% 52%)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.55"
        strokeLinecap="round"
      />
      <line
        x1={p3s.x} y1={p3s.y} x2={p2s.x} y2={p2s.y}
        stroke="hsl(258 50% 52%)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.55"
        strokeLinecap="round"
      />

      {/* ── Curve — glow halo ───────────────────────────────────────────────── */}
      <path
        d={curvePath}
        fill="none"
        stroke="hsl(258 90% 66%)"
        strokeWidth="8"
        opacity="0.1"
        strokeLinecap="round"
      />

      {/* ── Curve — main stroke ─────────────────────────────────────────────── */}
      <path
        d={curvePath}
        fill="none"
        stroke="url(#ce-curve-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#ce-glow)"
      />

      {/* ── Anchors (fixed P0 and P3) ───────────────────────────────────────── */}
      <Anchor cx={p0s.x} cy={p0s.y} color="hsl(192 85% 55%)" />
      <Anchor cx={p3s.x} cy={p3s.y} color="hsl(192 85% 55%)" />

      {/* ── Draggable handles (P1 and P2) ──────────────────────────────────── */}
      <Handle
        cx={p1s.x} cy={p1s.y}
        isDragging={dragging === 1}
        color="hsl(258 90% 66%)"
        onPointerDown={(e) => handlePointerDown(e, 1)}
      />
      <Handle
        cx={p2s.x} cy={p2s.y}
        isDragging={dragging === 2}
        color="hsl(258 90% 66%)"
        onPointerDown={(e) => handlePointerDown(e, 2)}
      />

      {/* ── Coordinate labels near handles ─────────────────────────────────── */}
      <HandleLabel
        svgX={p1s.x} svgY={p1s.y}
        curveX={p1.x} curveY={p1.y}
        anchor={p1LabelAnchor}
      />
      <HandleLabel
        svgX={p2s.x} svgY={p2s.y}
        curveX={p2.x} curveY={p2.y}
        anchor={p2LabelAnchor}
      />

      {/* ── P0 / P3 corner labels ───────────────────────────────────────────── */}
      <text
        x={p0s.x + 10} y={p0s.y - 4}
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: 'hsl(192 70% 45%)' } as unknown as React.CSSProperties}
      >
        P0 (0, 0)
      </text>
      <text
        x={p3s.x - 10} y={p3s.y + 14}
        textAnchor="end"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fill: 'hsl(192 70% 45%)' } as unknown as React.CSSProperties}
      >
        P3 (1, 1)
      </text>
    </svg>
  );
}
