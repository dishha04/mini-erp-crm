import { useContext } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#eee', alignItems: 'center' }}>
        <strong>Mini ERP</strong>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/customers">Customers</Link>
        <Link to="/products">Products</Link>
        <Link to="/challans">Challans</Link>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ marginRight: '1rem' }}>{user?.name || user?.userId} ({user?.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main style={{ padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
