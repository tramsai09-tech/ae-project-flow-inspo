import React, { useState, useEffect, useRef } from 'react';
import { PresetStorage, Preset } from '@ae-motion-tools/preset-library';

// ── Mini curve preview (inline SVG per button) ─────────────────────────────────

const PW = 58;   // preview SVG width
const PH = 38;   // preview SVG height
const PP = 6;    // padding inside preview SVG

function miniX(x: number) { return PP + x * (PW - 2 * PP); }
function miniY(y: number) { return (PH - PP) - y * (PH - 2 * PP); }

function MiniCurve({ preset }: { preset: Preset }) {
  const { p1, p2 } = preset;
  const d = [
    `M ${miniX(0)} ${miniY(0)}`,
    `C ${miniX(p1.x)} ${miniY(p1.y)}`,
    `  ${miniX(p2.x)} ${miniY(p2.y)}`,
    `  ${miniX(1)} ${miniY(1)}`,
  ].join(' ');

  return (
    <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} aria-hidden>
      {/* Container */}
      <rect x={PP} y={PP} width={PW - 2 * PP} height={PH - 2 * PP}
        fill="hsl(224 14% 12%)" rx="2" />
      {/* Diagonal reference */}
      <line
        x1={miniX(0)} y1={miniY(0)} x2={miniX(1)} y2={miniY(1)}
        stroke="hsl(224 8% 22%)" strokeWidth="0.5"
      />
      {/* Curve */}
      <path d={d} fill="none" stroke="hsl(258 90% 66%)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface PresetPanelProps {
  onApply: (preset: Preset) => void;
  currentPoints: [number, number, number, number]; // [p1.x, p1.y, p2.x, p2.y]
}

export function PresetPanel({ onApply, currentPoints }: PresetPanelProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPresets = () => {
    setPresets(PresetStorage.loadAll());
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const handleSave = () => {
    const name = prompt('Enter a name for the preset:');
    if (!name) return;
    
    const id = name.toLowerCase().replace(/\s+/g, '-');
    const [p1x, p1y, p2x, p2y] = currentPoints;
    
    try {
      PresetStorage.savePreset({
        id,
        name,
        p1: { x: p1x, y: p1y },
        p2: { x: p2x, y: p2y },
        isBuiltIn: false
      });
      loadPresets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this preset?')) {
      try {
        PresetStorage.deletePreset(id);
        loadPresets();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleExport = () => {
    const json = PresetStorage.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ae-motion-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        PresetStorage.importJSON(event.target?.result as string);
        loadPresets();
      } catch (err: any) {
        alert('Failed to import JSON: ' + err.message);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Presets</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn-icon" onClick={handleSave} title="Save current curve as preset" style={{ padding: '2px 6px', height: 'auto', fontSize: '10px' }}>Save</button>
          <button className="btn-icon" onClick={handleExport} title="Export user presets" style={{ padding: '2px 6px', height: 'auto', fontSize: '10px' }}>Export</button>
          <button className="btn-icon" onClick={() => fileInputRef.current?.click()} title="Import user presets" style={{ padding: '2px 6px', height: 'auto', fontSize: '10px' }}>Import</button>
          <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleImport} />
        </div>
      </div>

      <div className="preset-grid">
        {presets.map((preset) => (
          <div key={preset.id} style={{ position: 'relative' }}>
            <button
              className="preset-btn"
              style={{ width: '100%' }}
              onClick={() => onApply(preset)}
              title={`Apply ${preset.name} preset`}
            >
              <MiniCurve preset={preset} />
              <span>{preset.name}</span>
            </button>
            {!preset.isBuiltIn && (
              <button 
                onClick={(e) => handleDelete(preset.id, e)}
                style={{ 
                  position: 'absolute', top: '2px', right: '2px', 
                  background: 'var(--bg-panel)', color: 'var(--text-3)', 
                  border: '1px solid var(--border)', borderRadius: '4px', 
                  width: '16px', height: '16px', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', fontSize: '10px' 
                }}
                title="Delete preset"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
