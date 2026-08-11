import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Add form
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [customerType, setCustomerType] = useState('RETAIL');

  const fetchCustomers = async () => {
    try {
      const res = await client.get(`/customers?search=${search}`);
      setCustomers(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch customers');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/customers', { name, mobile, businessName, customerType });
      setName('');
      setMobile('');
      setBusinessName('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add customer');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2>Customers</h2>
      </div>
      
      {error && <div className="mb-2" style={{ color: 'var(--color-danger)', background: '#fee2e2', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}
      
      <div className="card">
        <form onSubmit={handleAdd} className="form-row" style={{ flexWrap: 'wrap' }}>
          <h3 style={{ width: '100%', marginBottom: 'var(--space-sm)' }}>Add Customer</h3>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Name</label>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Mobile</label>
            <input placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Business Name</label>
            <input placeholder="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Type</label>
            <select value={customerType} onChange={e => setCustomerType(e.target.value)}>
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: '1 1 100%', alignItems: 'flex-start' }}>
            <button type="submit" className="primary">Add Customer</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="mb-3" style={{ maxWidth: '300px' }}>
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Business Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Follow Up</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c: any) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.mobile}</td>
              <td>{c.businessName}</td>
              <td>{c.customerType}</td>
              <td>
                <span className={`badge ${c.status === 'ACTIVE' ? 'green' : c.status === 'INACTIVE' ? 'gray' : 'amber'}`}>
                  {c.status}
                </span>
              </td>
              <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '-'}</td>
              <td>
                <Link to={`/customers/${c.id}`} style={{ fontWeight: 500 }}>View / Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
