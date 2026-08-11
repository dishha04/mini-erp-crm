import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';

export default function ChallanDetailPage() {
  const { id } = useParams();
  const [challan, setChallan] = useState<any>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchChallan = async () => {
    try {
      const res = await client.get(`/challans/${id}`);
      setChallan(res.data);
    } catch (err: any) {
      setError('Failed to load challan');
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleConfirm = async () => {
    setActionError('');
    try {
      await client.put(`/challans/${id}/confirm`);
      fetchChallan();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to confirm challan');
    }
  };

  const handleCancel = async () => {
    setActionError('');
    try {
      await client.put(`/challans/${id}/cancel`);
      fetchChallan();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to cancel challan');
    }
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!challan) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2>Challan: {challan.challanNumber}</h2>
        <span className={`badge ${challan.status === 'CONFIRMED' ? 'green' : challan.status === 'CANCELLED' ? 'red' : 'gray'}`}>
          {challan.status}
        </span>
      </div>
      
      {actionError && <div className="mb-2" style={{ color: 'var(--color-danger)', background: '#fee2e2', padding: '0.75rem', borderRadius: '4px' }}>{actionError}</div>}
      
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Customer</p>
            <p style={{ fontWeight: 500 }}>{challan.customer?.name}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Quantity</p>
            <p>{challan.totalQuantity}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Created By</p>
            <p>{challan.createdBy?.name || challan.createdBy?.email || challan.createdById}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Date</p>
            <p>
              {new Date(challan.createdAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              })}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2" style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
          {challan.status === 'DRAFT' && (
            <button className="primary" onClick={handleConfirm}>Confirm Challan (Deduct Stock)</button>
          )}
          {challan.status !== 'CANCELLED' && (
            <button className="danger" onClick={handleCancel}>Cancel Challan</button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3">Line Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {challan.challanItems?.map((item: any) => (
              <tr key={item.id}>
                <td>{item.productNameSnapshot}</td>
                <td>{item.productSkuSnapshot}</td>
                <td>{item.unitPriceSnapshot}</td>
                <td>{item.quantity}</td>
                <td style={{ fontWeight: 500 }}>{(parseFloat(item.unitPriceSnapshot) * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
