import { useState, useCallback } from 'react';
import { useBezierEditor } from './hooks/useBezierEditor.ts';
import { BezierCanvas } from './components/BezierCanvas.tsx';
import { CoordinatePanel } from './components/CoordinatePanel.tsx';
import { PresetPanel } from './components/PresetPanel.tsx';
import { AnimationPreview } from './components/AnimationPreview.tsx';

// ── CSS output helper ──────────────────────────────────────────────────────────

function toCSSCubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const f = (n: number) => n.toFixed(3);
  return `cubic-bezier(${f(p1x)}, ${f(p1y)}, ${f(p2x)}, ${f(p2y)})`;
}

// ── CSS Output panel ───────────────────────────────────────────────────────────

function CSSOutputPanel({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {/* clipboard unavailable in insecure contexts */});
  }, [value]);

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">CSS Output</span>
      </div>

      <div className="css-code-block">
        <code className="css-value">{value}</code>
      </div>

      <div className="css-actions">
        <button
          id="copy-css-btn"
          className={`btn-icon${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          title="Copy CSS value to clipboard"
          aria-label="Copy CSS cubic-bezier value"
        >
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const { controlPoints, updateHandle, applyPreset, reset } = useBezierEditor();

  const [p1, p2] = [controlPoints[1], controlPoints[2]];
  const cssValue = toCSSCubicBezier(p1.x, p1.y, p2.x, p2.y);

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="header" role="banner">
        <div className="header-brand">
          <div className="header-logo" aria-hidden>⬡</div>
          <div>
            <div className="header-title">Cubic Bézier Editor</div>
            <div className="header-subtitle">AE Motion Tools</div>
          </div>
        </div>

        <div className="header-actions">
          <button
            id="reset-btn"
            className="btn-ghost"
            onClick={reset}
            title="Reset to default ease-in-out"
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="main" role="main">
        {/* Canvas — left column */}
        <section className="canvas-area" aria-label="Bézier curve editor canvas">
          <div className="canvas-wrapper">
            <BezierCanvas
              controlPoints={controlPoints}
              onPointChange={updateHandle}
            />
          </div>
        </section>

        {/* Sidebar — right column */}
        <aside className="sidebar" aria-label="Editor controls">
          <CoordinatePanel controlPoints={controlPoints} />
          <CSSOutputPanel value={cssValue} />
          <PresetPanel onApply={applyPreset} />
          <AnimationPreview controlPoints={controlPoints} />
        </aside>
      </main>
    </div>
  );
}
