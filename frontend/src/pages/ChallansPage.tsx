import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ChallansPage() {
  const [challans, setChallans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Add Challan form
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<{productId: string, quantity: number}[]>([]);

  const fetchChallans = async () => {
    try {
      const res = await client.get(`/challans?status=${statusFilter}`);
      setChallans(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch challans');
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        client.get('/customers'),
        client.get('/products')
      ]);
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [statusFilter]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleAddLine = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    if (field === 'productId') newItems[index].productId = value;
    if (field === 'quantity') newItems[index].quantity = parseInt(value) || 1;
    setItems(newItems);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return alert('Add at least one item');
    try {
      await client.post('/challans', { customerId, items });
      setCustomerId('');
      setItems([]);
      fetchChallans();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create challan');
    }
  };

  return (
    <div>
      <h2>Sales Challans</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <h3>Create Draft Challan</h3>
        <div style={{ marginBottom: '1rem' }}>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
            <option value="">-- Select Customer --</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        {items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: '0.5rem' }}>
            <select value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)} required>
              <option value="">-- Select Product --</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
              ))}
            </select>
            <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required style={{ width: '60px', marginLeft: '10px' }} />
          </div>
        ))}
        <button type="button" onClick={handleAddLine} style={{ marginRight: '10px' }}>+ Add Item</button>
        <button type="submit">Create Challan</button>
      </form>

      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ marginBottom: '1rem' }}>
        <option value="">All Statuses</option>
        <option value="DRAFT">DRAFT</option>
        <option value="CONFIRMED">CONFIRMED</option>
        <option value="CANCELLED">CANCELLED</option>
      </select>

      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Challan No</th>
            <th>Customer</th>
            <th>Total Qty</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {challans.map((c: any) => (
            <tr key={c.id}>
              <td>{c.challanNumber}</td>
              <td>{c.customer?.name}</td>
              <td>{c.totalQuantity}</td>
              <td>{c.status}</td>
              <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              <td>
                <Link to={`/challans/${c.id}`}>View / Manage</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
