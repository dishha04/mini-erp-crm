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
      <h2>Challan: {challan.challanNumber}</h2>
      {actionError && <div style={{ color: 'red', padding: '1rem', border: '1px solid red', marginBottom: '1rem' }}>{actionError}</div>}
      
      <div style={{ marginBottom: '2rem' }}>
        <p><strong>Status:</strong> {challan.status}</p>
        <p><strong>Customer:</strong> {challan.customer?.name}</p>
        <p><strong>Created By:</strong> {challan.createdBy?.name || challan.createdBy?.email}</p>
        <p><strong>Date:</strong> {new Date(challan.createdAt).toLocaleString()}</p>
        
        <div style={{ marginTop: '1rem' }}>
          {challan.status === 'DRAFT' && (
            <button onClick={handleConfirm} style={{ marginRight: '10px', background: 'green', color: 'white' }}>Confirm Challan (Deduct Stock)</button>
          )}
          {challan.status !== 'CANCELLED' && (
            <button onClick={handleCancel} style={{ background: 'red', color: 'white' }}>Cancel Challan</button>
          )}
        </div>
      </div>

      <h3>Line Items</h3>
      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
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
              <td>{(parseFloat(item.unitPriceSnapshot) * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
