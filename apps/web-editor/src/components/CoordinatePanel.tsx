import type { ControlPoints } from '@ae-motion-tools/curve-engine';

interface CoordinatePanelProps {
  controlPoints: ControlPoints;
}

const ROWS = [
  { index: 0 as const, badge: 'P0', name: 'Start',    sublabel: 'Anchor',   dot: 'cyan',  fixed: true  },
  { index: 1 as const, badge: 'P1', name: 'Handle 1', sublabel: 'Drag me',  dot: 'brand', fixed: false },
  { index: 2 as const, badge: 'P2', name: 'Handle 2', sublabel: 'Drag me',  dot: 'brand', fixed: false },
  { index: 3 as const, badge: 'P3', name: 'End',      sublabel: 'Anchor',   dot: 'cyan',  fixed: true  },
] as const;

function fmt(n: number) {
  return n.toFixed(3);
}

export function CoordinatePanel({ controlPoints }: CoordinatePanelProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Control Points</span>
      </div>

      <div className="coord-list">
        {ROWS.map(({ index, badge, name, sublabel, dot, fixed }) => {
          const pt = controlPoints[index];
          return (
            <div key={badge} className="coord-row">
              <span className={`coord-dot ${dot}`} />
              <span className="coord-badge">{badge}</span>
              <div className="coord-name">
                {name}
                <small>{fixed ? sublabel : '↕ draggable'}</small>
              </div>
              <div className={`coord-values${fixed ? ' fixed' : ''}`}>
                ({fmt(pt.x)},&nbsp;{fmt(pt.y)})
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
