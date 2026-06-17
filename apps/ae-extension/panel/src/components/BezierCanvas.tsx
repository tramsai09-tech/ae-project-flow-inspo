/**
 * BezierCanvas — SVG-based cubic Bézier editor matching Flow visual style.
 */

import React, { useCallback, useRef, useState } from 'react';
import type { ControlPoints, Point2D } from '@ae-motion-tools/curve-engine';

// ── SVG layout constants ───────────────────────────────────────────────────────
// Graph occupies entire viewBox except for small margins to show handles.

const VSIZE  = 470;
const ORIG_X = 8;
const ORIG_Y = 462;
const WORK   = 454;

const toSVGX = (cx: number) => ORIG_X + cx * WORK;
const toSVGY = (cy: number) => ORIG_Y - cy * WORK;

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Background grid — major lines at 0.25 intervals */
function Grid() {
  const major = [0, 0.25, 0.5, 0.75, 1];

  return (
    <g>
      {/* Background */}
      <rect
        x={ORIG_X} y={toSVGY(1)}
        width={WORK} height={WORK}
        fill="#2A2A2A"
      />

      {/* Gridlines */}
      {major.map((v) => {
        const isEdge = v === 0 || v === 1;
        const stroke = isEdge ? '#4D82CA' : '#3E3E3E'; // Blue edge for left/bottom as seen in screenshot
        const w = 1;
        return (
          <g key={v}>
            <line
              x1={toSVGX(v)} y1={toSVGY(1)}
              x2={toSVGX(v)} y2={toSVGY(0)}
              stroke={v === 0 ? '#4D82CA' : '#3E3E3E'} strokeWidth={w}
            />
            <line
              x1={toSVGX(0)} y1={toSVGY(v)}
              x2={toSVGX(1)} y2={toSVGY(v)}
              stroke={v === 0 ? '#4D82CA' : '#3E3E3E'} strokeWidth={w}
            />
          </g>
        );
      })}
    </g>
  );
}

/** Circle anchor marker for P0 and P3 */
function Anchor({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return <circle cx={cx} cy={cy} r={6} fill={color} />;
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
      <circle cx={cx} cy={cy} r={6} fill={color} />
      {/* Invisible hit area for easier grabbing */}
      <circle cx={cx} cy={cy} r={36} fill="transparent" />
    </g>
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

  const p0s = { x: toSVGX(p0.x), y: toSVGY(p0.y) };
  const p1s = { x: toSVGX(p1.x), y: toSVGY(p1.y) };
  const p2s = { x: toSVGX(p2.x), y: toSVGY(p2.y) };
  const p3s = { x: toSVGX(p3.x), y: toSVGY(p3.y) };

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

  const svgToCurve = useCallback((svgPt: Point2D): Point2D => ({
    x: (svgPt.x - ORIG_X) / WORK,
    y: (ORIG_Y - svgPt.y) / WORK,
  }), []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, index: 1 | 2) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(index);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging === null) return;
      e.preventDefault(); // Prevent accidental panning/scrolling
      const svgPt = clientToSVG(e.clientX, e.clientY);
      const curvePt = svgToCurve(svgPt);
      
      // Strict horizontal bounding: Bezier X must be in [0, 1]
      // Y is allowed to exceed bounds for bounce/anticipation effects
      curvePt.x = Math.max(0, Math.min(1, curvePt.x));
      
      onPointChange(dragging, curvePt);
    },
    [dragging, clientToSVG, svgToCurve, onPointChange],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(null);
  }, []);

  const curvePath = `M ${p0s.x} ${p0s.y} C ${p1s.x} ${p1s.y} ${p2s.x} ${p2s.y} ${p3s.x} ${p3s.y}`;
  const handleColor = "#F9B838"; // Orange/Amber from screenshot

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
      {/* ── Background ─────────────────────────────────────────────────────── */}
      <rect width={VSIZE} height={VSIZE} fill="#242424" />

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <Grid />

      {/* ── Control arms ───────────────────────────────────────────────────── */}
      <line
        x1={p0s.x} y1={p0s.y} x2={p1s.x} y2={p1s.y}
        stroke={handleColor}
        strokeWidth="2"
      />
      <line
        x1={p3s.x} y1={p3s.y} x2={p2s.x} y2={p2s.y}
        stroke={handleColor}
        strokeWidth="2"
      />

      {/* ── Curve ──────────────────────────────────────────────────────────── */}
      <path
        d={curvePath}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* ── Anchors ────────────────────────────────────────────────────────── */}
      <Anchor cx={p0s.x} cy={p0s.y} color={handleColor} />
      <Anchor cx={p3s.x} cy={p3s.y} color={handleColor} />

      {/* ── Draggable handles ──────────────────────────────────────────────── */}
      <Handle
        cx={p1s.x} cy={p1s.y}
        isDragging={dragging === 1}
        color={handleColor}
        onPointerDown={(e) => handlePointerDown(e, 1)}
      />
      <Handle
        cx={p2s.x} cy={p2s.y}
        isDragging={dragging === 2}
        color={handleColor}
        onPointerDown={(e) => handlePointerDown(e, 2)}
      />
    </svg>
  );
}
