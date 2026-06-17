import { useCallback } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useBezierEditor } from './hooks/useBezierEditor.ts';
import { BezierCanvas } from './components/BezierCanvas.tsx';
import { PresetPanel } from './components/PresetPanel.tsx';
import { CompactControlsBar } from './components/CompactControlsBar.tsx';

import { evalScript } from './utils/cep.ts';

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  const { controlPoints, updateHandle, applyPreset, reset } = useBezierEditor();

  const handleApplyToAE = useCallback(async () => {
    try {
      const p1 = { x: controlPoints[1].x, y: controlPoints[1].y };
      const p2 = { x: controlPoints[2].x, y: controlPoints[2].y };
      
      const res = await evalScript('applyBezierToSelectedKeys', { p1, p2 });
      if (res && res.startsWith('SUCCESS')) {
        // Optional: flash a success state if you want, but silent success is usually best
        console.log(res);
      }
    } catch (err) {
      alert(`Could not apply curve:\n${err}`);
    }
  }, [controlPoints]);

  const handleTest = async () => {
    try {
      const res = await evalScript('testConnectionAlert');
      alert(`React side received: ${res}`);
    } catch (err) {
      alert(`React side error: ${err}`);
    }
  };

  const handleCreateLayer = async (type: 'null' | 'adjustment' | 'camera') => {
    try {
      const funcName = type === 'null' ? 'createNullLayer' 
        : type === 'adjustment' ? 'createAdjustmentLayer' 
        : 'createCameraLayer';
      const res = await evalScript(funcName);
      if (res && res.startsWith('ERROR')) {
        alert(res);
      }
    } catch (err) {
      alert(`Error creating layer: ${err}`);
    }
  };

  return (
    <div className="app">
      {/* ── Top Bar ── */}
      <div style={{ background: 'var(--brand)', padding: '4px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
        <button 
          onClick={() => handleCreateLayer('null')}
          style={{ background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '11px', cursor: 'pointer', border: 'none', padding: '2px 8px', borderRadius: '4px' }}
        >
          + Null
        </button>
        <button 
          onClick={() => handleCreateLayer('adjustment')}
          style={{ background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '11px', cursor: 'pointer', border: 'none', padding: '2px 8px', borderRadius: '4px' }}
        >
          + Adjustment
        </button>
        <button 
          onClick={() => handleCreateLayer('camera')}
          style={{ background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '11px', cursor: 'pointer', border: 'none', padding: '2px 8px', borderRadius: '4px' }}
        >
          + Camera
        </button>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
        <button 
          onClick={handleTest}
          style={{ background: 'transparent', color: 'white', fontSize: '11px', cursor: 'pointer', border: 'none' }}
        >
          Test Connection
        </button>
      </div>

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
