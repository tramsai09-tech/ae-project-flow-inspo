import React from 'react';
import ReactDOM from 'react-dom/client';
import { evalScript } from './utils/cep';

function App() {
  const [hostStatus, setHostStatus] = React.useState<string>('Checking connection...');

  React.useEffect(() => {
    // Ping the AE host environment when the panel loads
    evalScript('pingHost')
      .then(res => setHostStatus(res))
      .catch(err => setHostStatus('Connection failed: ' + err.message));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'white', background: '#242424', height: '100vh' }}>
      <h1>AE Motion Tools</h1>
      <p>CEP Panel Architecture Scaffolded.</p>
      <div style={{ marginTop: '20px', padding: '10px', background: '#333', borderRadius: '4px' }}>
        <strong>Host Status:</strong> {hostStatus}
      </div>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        Next Step: Integrate the UI components from the web-editor package.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
