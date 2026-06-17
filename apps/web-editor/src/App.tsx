import { useCallback } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useBezierEditor } from './hooks/useBezierEditor.ts';
import { BezierCanvas } from './components/BezierCanvas.tsx';
import { PresetPanel } from './components/PresetPanel.tsx';
import { CompactControlsBar } from './components/CompactControlsBar.tsx';

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const { controlPoints, updateHandle, applyPreset, reset } = useBezierEditor();

  const handleApplyToAE = useCallback(() => {
    // In the future this will run the CSInterface export to AE
    console.log("Applied ease to AE:", controlPoints);
  }, [controlPoints]);

  return (
    <div className="app">
      {/* ── Horizontal Split: Graph | Presets ─────────────────────────────── */}
      <main className="main" role="main">
        <Group direction="horizontal">
          {/* ── Left: Curve Editor ── */}
          <Panel minSize={30} defaultSize={65} className="editor-panel">
            <div className="canvas-wrapper">
              <BezierCanvas
                controlPoints={controlPoints}
                onPointChange={updateHandle}
              />
            </div>
          </Panel>

          <Separator className="resize-handle vertical" />

          {/* ── Right: Preset Library ── */}
          <Panel minSize={25} defaultSize={35} className="preset-panel">
            <PresetPanel
              onApply={applyPreset}
              currentPoints={[controlPoints[1].x, controlPoints[1].y, controlPoints[2].x, controlPoints[2].y]}
            />
          </Panel>
        </Group>
      </main>

      {/* ── Bottom Bar (full width, below both panels) ───────────────────── */}
      <CompactControlsBar
        controlPoints={controlPoints}
        updateHandle={updateHandle}
        onApply={handleApplyToAE}
        onReset={reset}
      />
    </div>
  );
}
