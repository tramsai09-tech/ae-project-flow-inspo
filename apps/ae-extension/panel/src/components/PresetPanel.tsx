import React, { useState, useMemo, useEffect, useRef } from 'react';

export interface Preset {
  id: string;
  name: string;
  category: string;
  isBuiltIn: boolean;
  isFavorite: boolean;
  lastUsed?: number;
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}

interface PresetPanelProps {
  onApply: (preset: Preset) => void;
  currentPoints: [number, number, number, number];
}

const BASE_CURVES: Record<string, [number, number, number, number]> = {
  ease:  [0.42, 0, 1, 1],
  quad:  [0.55, 0.085, 0.68, 0.53],
  cubic: [0.55, 0.055, 0.675, 0.19],
  quart: [0.895, 0.03, 0.685, 0.22],
  quint: [0.755, 0.05, 0.855, 0.06],
  expo:  [0.95, 0.05, 0.795, 0.035],
  circ:  [0.6, 0.04, 0.98, 0.335],
  back:  [0.6, -0.28, 0.735, 0.045],
};

function generateEasingFamilies(): Preset[] {
  const presets: Preset[] = [];
  let idCounter = 1;

  // 1. linear
  presets.push({
    id: String(idCounter++),
    name: 'linear',
    category: 'linear',
    isBuiltIn: true,
    isFavorite: false,
    p1: { x: 0, y: 0 },
    p2: { x: 1, y: 1 }
  });

  for (const [category, [x1, y1, x2, y2]] of Object.entries(BASE_CURVES)) {
    const nameLower = category; // already lowercase

    // In (Base)
    presets.push({
      id: String(idCounter++),
      name: `${nameLower}In`,
      category,
      isBuiltIn: true,
      isFavorite: false,
      p1: { x: x1, y: y1 },
      p2: { x: x2, y: y2 }
    });

    // Out (Inverse of In)
    const outX1 = 1 - x2, outY1 = 1 - y2;
    const outX2 = 1 - x1, outY2 = 1 - y1;
    presets.push({
      id: String(idCounter++),
      name: `${nameLower}Out`,
      category,
      isBuiltIn: true,
      isFavorite: false,
      p1: { x: outX1, y: outY1 },
      p2: { x: outX2, y: outY2 }
    });

    // InOut (Starts like In, ends like Out) -> Named without suffix
    presets.push({
      id: String(idCounter++),
      name: nameLower,
      category,
      isBuiltIn: true,
      isFavorite: false,
      p1: { x: x1, y: y1 },
      p2: { x: outX2, y: outY2 }
    });
  }

  return presets;
}

const INITIAL_PRESETS: Preset[] = generateEasingFamilies();

/** Square curve thumbnail matching Flow style */
function CurveThumb({ p1, p2 }: { p1: {x:number, y:number}, p2: {x:number, y:number} }) {
  const s = 60;
  const pad = 8;
  const iw = s - pad * 2;

  const x0 = pad, y0 = s - pad;
  const x3 = s - pad, y3 = pad;
  const cx1 = pad + p1.x * iw, cy1 = s - pad - p1.y * iw;
  const cx2 = pad + p2.x * iw, cy2 = s - pad - p2.y * iw;

  const path = `M${x0},${y0} C${cx1},${cy1} ${cx2},${cy2} ${x3},${y3}`;

  return (
    <svg className="curve-thumb" viewBox={`0 0 ${s} ${s}`}>
      {/* Border box */}
      <rect x={pad} y={pad} width={iw} height={iw} fill="none" stroke="hsl(0 0% 22%)" strokeWidth="0.5" />
      {/* Diagonal ref */}
      <line x1={x0} y1={y0} x2={x3} y2={y3} stroke="hsl(0 0% 20%)" strokeWidth="0.5" />
      {/* Curve */}
      <path d={path} fill="none" stroke="hsl(0 0% 75%)" strokeWidth="2" strokeLinecap="round" className="thumb-curve" />
    </svg>
  );
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase()
          ? <mark key={i} className="search-highlight">{part}</mark>
          : <React.Fragment key={i}>{part}</React.Fragment>
      )}
    </>
  );
}

export function PresetPanel({ onApply, currentPoints }: PresetPanelProps) {
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const stored = localStorage.getItem('aemotion_presets');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load presets', e);
    }
    return INITIAL_PRESETS;
  });
  
  const [search, setSearch] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>('4'); // "ease" selected by default

  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('aemotion_presets', JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to save presets', e);
    }
  }, [presets]);

  useEffect(() => {
    if (isSaving && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSaving]);

  const filteredPresets = useMemo(() => {
    let result = presets;
    if (showFavoritesOnly) {
      result = result.filter(p => p.isFavorite);
    }
    if (!search) return result;
    const s = search.toLowerCase();
    return result.filter(p => 
      p.name.toLowerCase().includes(s) || 
      p.category.toLowerCase().includes(s)
    );
  }, [presets, search, showFavoritesOnly]);

  const handleApply = (preset: Preset) => {
    setActivePresetId(preset.id);
    setPresets(prev => prev.map(p => p.id === preset.id ? { ...p, lastUsed: Date.now() } : p));
    onApply(preset);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPresets(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this preset?')) {
      setPresets(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSaveSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!saveName.trim()) {
      setIsSaving(false);
      return;
    }

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: saveName.trim(),
      category: 'User',
      isBuiltIn: false,
      isFavorite: false,
      p1: { x: currentPoints[0], y: currentPoints[1] },
      p2: { x: currentPoints[2], y: currentPoints[3] }
    };

    setPresets(prev => [...prev, newPreset]);
    setSaveName('');
    setIsSaving(false);
  };

  const handleCancelSave = () => {
    setSaveName('');
    setIsSaving(false);
  };

  const handleCopy = async () => {
    try {
      const cssStr = `cubic-bezier(${currentPoints[0]}, ${currentPoints[1]}, ${currentPoints[2]}, ${currentPoints[3]})`;
      await navigator.clipboard.writeText(cssStr);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/cubic-bezier\(([^,]+),([^,]+),([^,]+),([^)]+)\)/);
      let newPoints: [number, number, number, number] | null = null;
      
      if (match) {
        newPoints = [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])];
      } else {
        const parts = text.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 4 && parts.every(n => !isNaN(n))) {
          newPoints = parts as [number, number, number, number];
        }
      }

      if (newPoints && newPoints.every(n => !isNaN(n))) {
        const tempPreset: Preset = {
          id: 'pasted-' + Date.now(),
          name: 'Pasted Curve',
          category: 'Pasted',
          isBuiltIn: false,
          isFavorite: false,
          p1: { x: newPoints[0], y: newPoints[1] },
          p2: { x: newPoints[2], y: newPoints[3] }
        };
        onApply(tempPreset);
      } else {
        alert("Invalid clipboard format. Expected cubic-bezier(x1, y1, x2, y2) or x1, y1, x2, y2");
      }
    } catch (e) {
      console.error('Failed to paste', e);
      alert("Failed to read from clipboard.");
    }
  };

  const handleDeleteActive = () => {
    if (!activePresetId) return;
    const active = presets.find(p => p.id === activePresetId);
    if (active && !active.isBuiltIn) {
      if (confirm(`Delete preset "${active.name}"?`)) {
        setPresets(prev => prev.filter(p => p.id !== activePresetId));
        setActivePresetId(null);
      }
    } else if (active && active.isBuiltIn) {
      alert("Cannot delete built-in presets.");
    }
  };

  return (
    <div className="preset-panel-container">
      {/* ── Library Header ── */}
      <div className="library-header">
        {isSaving ? (
          <form className="save-preset-form" onSubmit={handleSaveSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="save-preset-input"
              placeholder="Preset name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onBlur={handleCancelSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancelSave();
              }}
            />
          </form>
        ) : (
          <>
            <span className="library-name">default</span>
            <span className="library-dropdown">▾</span>
            <div className="library-actions">
              <button className="lib-btn" onClick={() => setIsSaving(true)} title="Save Current">+</button>
              <button className="lib-btn" onClick={handleCopy} title="Copy">⧉</button>
              <button className="lib-btn" onClick={handlePaste} title="Paste">📋</button>
              <button className="lib-btn" onClick={handleDeleteActive} title="Delete Active Preset">🗑</button>
            </div>
          </>
        )}
      </div>

      {/* ── Search and Filters ── */}
      <div className="preset-search-bar">
        <input
          type="text"
          className="preset-search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button 
          className={`filter-fav-btn ${showFavoritesOnly ? 'active' : ''}`}
          onClick={() => setShowFavoritesOnly(prev => !prev)}
          title="Show Favorites Only"
        >
          ★
        </button>
      </div>

      {/* ── Preset Grid ── */}
      <div className="preset-grid">
        {filteredPresets.length === 0 && (
          <div className="empty-state">No presets found.</div>
        )}

        {filteredPresets.map((p) => (
          <div key={p.id} className="preset-card-wrapper">
            <button
              className={`preset-btn ${p.id === activePresetId ? 'selected' : ''}`}
              onClick={() => handleApply(p)}
              title={`${p.name} (${p.category})`}
            >
              <CurveThumb p1={p.p1} p2={p.p2} />
              <span className="preset-name">
                <HighlightedText text={p.name} highlight={search} />
              </span>
            </button>

            {/* Hover actions */}
            <div className="preset-card-actions">
              <button
                className={`action-btn fav-btn ${p.isFavorite ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(e, p.id)}
                title="Favorite"
              >
                ★
              </button>
              {!p.isBuiltIn && (
                <button className="action-btn" onClick={(e) => handleDelete(e, p.id)} title="Delete">×</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
