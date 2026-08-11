import { useEffect, useState } from 'react';
import client from './api/client';

function App() {
  const [status, setStatus] = useState<string>('Checking backend connection...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.get('/health')
      .then((res) => {
        setStatus(`Backend status: ${res.data.status}`);
      })
      .catch((err) => {
        setError(err.message || 'Failed to connect to backend');
        setStatus('');
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Mini ERP + CRM</h1>
      {error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <p>{status}</p>
      )}
    </div>
  );
}

export default App;
