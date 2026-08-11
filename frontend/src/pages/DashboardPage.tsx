import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState({
    customers: null as number | string | null,
    products: null as number | string | null,
    lowStock: null as number | string | null,
    draftChallans: null as number | string | null,
    confirmedChallans: null as number | string | null,
  });

  useEffect(() => {
    const fetchStat = async (endpoint: string) => {
      try {
        const res = await client.get(endpoint);
        return res.data.total;
      } catch (error) {
        return '-';
      }
    };

    const fetchAll = async () => {
      const [customers, products, lowStock, draftChallans, confirmedChallans] = await Promise.all([
        fetchStat('/customers?limit=1'),
        fetchStat('/products?limit=1'),
        fetchStat('/products?lowStock=true&limit=1'),
        fetchStat('/challans?status=DRAFT&limit=1'),
        fetchStat('/challans?status=CONFIRMED&limit=1'),
      ]);

      setStats({
        customers,
        products,
        lowStock,
        draftChallans,
        confirmedChallans,
      });
    };

    fetchAll();
  }, []);

  const StatCard = ({ title, value }: { title: string, value: number | string | null }) => (
    <div className="card" style={{ flex: '1 1 200px', marginBottom: 0, textAlign: 'center', padding: '1.5rem 1rem' }}>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
        {value === null ? '...' : value}
      </p>
    </div>
  );

  return (
    <div>
      <h1 className="mb-3">Dashboard</h1>
      
      <div className="card mb-4" style={{ padding: '1rem 1.5rem' }}>
        <p>Welcome back, <strong>{user?.name || user?.userId}</strong>!</p>
        <p style={{ marginTop: '0.25rem' }}>Your role is: <span className="badge gray">{user?.role}</span></p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <StatCard title="Total Customers" value={stats.customers} />
        <StatCard title="Total Products" value={stats.products} />
        <StatCard title="Low Stock Alerts" value={stats.lowStock} />
        <StatCard title="Draft Challans" value={stats.draftChallans} />
        <StatCard title="Confirmed Challans" value={stats.confirmedChallans} />
      </div>

      <div className="card">
        <h2 className="mb-3" style={{ fontSize: '1.25rem' }}>Quick Links</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/customers">
            <button className="secondary">Manage Customers</button>
          </Link>
          <Link to="/products">
            <button className="secondary">Products & Inventory</button>
          </Link>
          <Link to="/challans">
            <button className="secondary">Sales Challans</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
