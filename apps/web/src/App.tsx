/**
 * App root component
 *
 * Phase 1: Placeholder shell — WorkspaceLayout and feature panels
 * will be composed here once each feature module is implemented.
 */
export default function App() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'hsl(224, 15%, 8%)',
        color: 'hsl(220, 20%, 95%)',
        fontFamily: "'Inter', system-ui, sans-serif",
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
        AE Motion Tools
      </h1>
      <p style={{ fontSize: '14px', color: 'hsl(220, 10%, 55%)', margin: 0 }}>
        Monorepo scaffold ready — Phase 1 implementation begins here.
      </p>
    </div>
  );
}
