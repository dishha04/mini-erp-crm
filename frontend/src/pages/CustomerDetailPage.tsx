import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');

  const fetchCustomer = async () => {
    try {
      const res = await client.get(`/customers/${id}`);
      setCustomer(res.data);
      setFormData(res.data);
    } catch (err: any) {
      setError('Failed to load customer');
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.put(`/customers/${id}`, formData);
      setEditMode(false);
      fetchCustomer();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!customer) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="mb-3">Customer Details: {customer.name}</h2>
      <div className="card" style={{ maxWidth: '600px' }}>
      {!editMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <p><strong>Mobile:</strong> {customer.mobile}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Business Name:</strong> {customer.businessName}</p>
          <p><strong>Type:</strong> {customer.customerType}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span className={`badge ${customer.status === 'ACTIVE' ? 'green' : customer.status === 'INACTIVE' ? 'gray' : 'amber'}`}>
              {customer.status}
            </span>
          </p>
          <p><strong>Follow Up Date:</strong> {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Notes:</strong> {customer.notes}</p>
          <div className="mt-2" style={{ marginTop: 'var(--space-md)' }}>
            <button className="primary" onClick={() => setEditMode(true)}>Edit</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Name</label>
            <input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" required />
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Mobile" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
          </div>
          <div className="form-group">
            <label>Business Name</label>
            <input value={formData.businessName || ''} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="Business Name" />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={formData.customerType || 'RETAIL'} onChange={e => setFormData({...formData, customerType: e.target.value})}>
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={formData.status || 'LEAD'} onChange={e => setFormData({...formData, status: e.target.value})}>
              <option value="LEAD">LEAD</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="form-group">
            <label>Follow Up Date</label>
            <input type="date" value={formData.followUpDate ? formData.followUpDate.split('T')[0] : ''} onChange={e => setFormData({...formData, followUpDate: e.target.value ? new Date(e.target.value).toISOString() : null})} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Notes" rows={4} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="primary">Save</button>
            <button type="button" className="secondary" onClick={() => { setEditMode(false); setFormData(customer); }}>Cancel</button>
          </div>
        </form>
      )}
      </div>
    </div>
  );
}
