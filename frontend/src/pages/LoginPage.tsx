import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await client.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="mb-3" style={{ textAlign: 'center' }}>Login</h1>
        {error && <div className="mb-2" style={{ color: 'var(--color-danger)', background: '#fee2e2', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="primary" style={{ marginTop: '0.5rem' }}>Sign In</button>
        </form>
        <hr style={{ margin: '1.5rem 0 1rem 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Test Credentials</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div><strong>Admin:</strong> admin@erp.test / Admin@123</div>
            <div><strong>Sales:</strong> sales@erp.test / Sales@123</div>
            <div><strong>Warehouse:</strong> warehouse@erp.test / Warehouse@123</div>
            <div><strong>Accounts:</strong> accounts@erp.test / Accounts@123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
