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
      <h2>Customer Details: {customer.name}</h2>
      {!editMode ? (
        <div>
          <p><strong>Mobile:</strong> {customer.mobile}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Business Name:</strong> {customer.businessName}</p>
          <p><strong>Type:</strong> {customer.customerType}</p>
          <p><strong>Status:</strong> {customer.status}</p>
          <p><strong>Follow Up Date:</strong> {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Notes:</strong> {customer.notes}</p>
          <button onClick={() => setEditMode(true)}>Edit</button>
        </div>
      ) : (
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '10px' }}>
          <input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" required />
          <input value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Mobile" required />
          <input value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
          <input value={formData.businessName || ''} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="Business Name" />
          <select value={formData.customerType || 'RETAIL'} onChange={e => setFormData({...formData, customerType: e.target.value})}>
            <option value="RETAIL">RETAIL</option>
            <option value="WHOLESALE">WHOLESALE</option>
            <option value="DISTRIBUTOR">DISTRIBUTOR</option>
          </select>
          <select value={formData.status || 'LEAD'} onChange={e => setFormData({...formData, status: e.target.value})}>
            <option value="LEAD">LEAD</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <input type="date" value={formData.followUpDate ? formData.followUpDate.split('T')[0] : ''} onChange={e => setFormData({...formData, followUpDate: e.target.value ? new Date(e.target.value).toISOString() : null})} />
          <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Notes" />
          <button type="submit">Save</button>
          <button type="button" onClick={() => { setEditMode(false); setFormData(customer); }}>Cancel</button>
        </form>
      )}
    </div>
  );
}
