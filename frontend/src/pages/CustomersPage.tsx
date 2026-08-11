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
      <h2>Customers</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleAdd} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <h3>Add Customer</h3>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} required />
        <input placeholder="Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} />
        <select value={customerType} onChange={e => setCustomerType(e.target.value)}>
          <option value="RETAIL">RETAIL</option>
          <option value="WHOLESALE">WHOLESALE</option>
          <option value="DISTRIBUTOR">DISTRIBUTOR</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '1rem' }} />

      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
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
              <td>{c.status}</td>
              <td>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : ''}</td>
              <td>
                <Link to={`/customers/${c.id}`}>View / Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
