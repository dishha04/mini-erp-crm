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
      <nav className="navbar">
        <strong>Mini ERP</strong>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/customers" className="nav-link">Customers</Link>
          <Link to="/products" className="nav-link">Products</Link>
          <Link to="/challans" className="nav-link">Challans</Link>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ marginRight: '1rem' }}>{user?.name || user?.userId} <span className="badge gray">{user?.role}</span></span>
          <button className="secondary" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
