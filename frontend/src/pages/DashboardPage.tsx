import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  return (
    <div>
      <h1 className="mb-3">Dashboard</h1>
      <div className="card">
        <p>Welcome back, <strong>{user?.name || user?.userId}</strong>!</p>
        <p style={{ marginTop: '0.5rem' }}>Your role is: <span className="badge gray">{user?.role}</span></p>
      </div>
    </div>
  );
}
