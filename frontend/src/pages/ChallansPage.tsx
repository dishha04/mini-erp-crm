import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ChallansPage() {
  const [challans, setChallans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [error, setError] = useState('');

  // Add Challan form
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<{productId: string, quantity: number}[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchChallans = async () => {
    try {
      const res = await client.get(`/challans?status=${statusFilter}&customerId=${customerFilter}`);
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
  }, [statusFilter, customerFilter]);

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
      const res = await client.post('/challans', { customerId, items });
      const newChallanId = res.data.id || res.data.data?.id; // handling both response shapes just in case
      
      let confirmError = '';
      if (isConfirming && newChallanId) {
        try {
          await client.put(`/challans/${newChallanId}/confirm`);
        } catch (confirmErr: any) {
          confirmError = confirmErr.response?.data?.error || 'Failed to confirm challan';
        }
      }

      setCustomerId('');
      setItems([]);
      fetchChallans();

      if (confirmError) {
        alert(`Saved as draft, but could not confirm: ${confirmError}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create challan');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2>Sales Challans</h2>
      </div>
      {error && <div className="mb-2" style={{ color: 'var(--color-danger)', background: '#fee2e2', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}

      <div className="card">
        <form onSubmit={handleCreate}>
          <h3 className="mb-2">Create Draft Challan</h3>
          <div className="form-group mb-2">
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} required>
              <option value="">-- Select Customer --</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          {items.map((item, idx) => (
            <div key={idx} className="form-row mb-1">
              <select value={item.productId} onChange={e => handleItemChange(idx, 'productId', e.target.value)} required style={{ flex: 1 }}>
                <option value="">-- Select Product --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                ))}
              </select>
              <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required style={{ width: '100px' }} />
            </div>
          ))}
          <div className="flex gap-2 mt-2" style={{ marginTop: 'var(--space-md)' }}>
            <button type="button" className="secondary" onClick={handleAddLine} style={{ marginRight: 'auto' }}>+ Add Item</button>
            <button type="submit" className="secondary" onClick={() => setIsConfirming(false)}>Save as Draft</button>
            <button type="submit" className="primary" onClick={() => setIsConfirming(true)}>Save & Confirm</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="mb-3 flex gap-2" style={{ maxWidth: '600px' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '150px' }}>
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} style={{ flex: 1 }}>
            <option value="">All Customers</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

      <table>
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
              <td>
                <span className={`badge ${c.status === 'CONFIRMED' ? 'green' : c.status === 'CANCELLED' ? 'red' : 'gray'}`}>
                  {c.status}
                </span>
              </td>
              <td>
                {new Date(c.createdAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: 'numeric', minute: '2-digit', hour12: true
                })}
              </td>
              <td>
                <Link to={`/challans/${c.id}`} style={{ fontWeight: 500 }}>View / Manage</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
