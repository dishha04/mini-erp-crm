import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');

  const fetchProduct = async () => {
    try {
      const res = await client.get(`/products/${id}`);
      setProduct(res.data);
      setFormData({
        name: res.data.name,
        sku: res.data.sku,
        category: res.data.category || '',
        unitPrice: res.data.unitPrice,
        minStockAlert: res.data.minStockAlert,
        location: res.data.location || ''
      });
    } catch (err: any) {
      setError('Failed to load product');
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.put(`/products/${id}`, {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice),
        minStockAlert: parseInt(formData.minStockAlert) || 0
      });
      setEditMode(false);
      fetchProduct();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!product) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="mb-3">Product Details: {product.name}</h2>
      <div className="card" style={{ maxWidth: '600px', marginBottom: 'var(--space-lg)' }}>
      {!editMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <p><strong>SKU:</strong> {product.sku}</p>
          <p><strong>Category:</strong> {product.category || 'N/A'}</p>
          <p><strong>Unit Price:</strong> {product.unitPrice}</p>
          <p><strong>Current Stock:</strong> <span className={`badge ${product.currentStock <= product.minStockAlert ? 'red' : 'green'}`}>{product.currentStock}</span></p>
          <p><strong>Min Stock Alert:</strong> {product.minStockAlert}</p>
          <p><strong>Location:</strong> {product.location || 'N/A'}</p>
          
          <div className="mt-2" style={{ marginTop: 'var(--space-md)' }}>
            <button className="primary" onClick={() => setEditMode(true)}>Edit Product Info</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Name</label>
            <input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" required />
          </div>
          <div className="form-group">
            <label>SKU</label>
            <input value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU" required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Category" />
          </div>
          <div className="form-group">
            <label>Unit Price</label>
            <input type="number" step="0.01" value={formData.unitPrice || ''} onChange={e => setFormData({...formData, unitPrice: e.target.value})} placeholder="Unit Price" required />
          </div>
          <div className="form-group">
            <label>Min Stock Alert</label>
            <input type="number" value={formData.minStockAlert || ''} onChange={e => setFormData({...formData, minStockAlert: e.target.value})} placeholder="Min Stock Alert" />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Location" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="primary">Save</button>
            <button type="button" className="secondary" onClick={() => { 
              setEditMode(false); 
              setFormData({
                name: product.name,
                sku: product.sku,
                category: product.category || '',
                unitPrice: product.unitPrice,
                minStockAlert: product.minStockAlert,
                location: product.location || ''
              }); 
            }}>Cancel</button>
          </div>
        </form>
      )}
      </div>

      <div className="card">
        <h3 className="mb-3">Stock Movement History</h3>
        {product.stockMovements && product.stockMovements.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {product.stockMovements.map((movement: any) => (
                <tr key={movement.id}>
                  <td>{new Date(movement.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${movement.movementType === 'IN' ? 'green' : 'red'}`}>
                      {movement.movementType}
                    </span>
                  </td>
                  <td>{movement.quantity}</td>
                  <td>{movement.reason || '-'}</td>
                  <td>{movement.createdBy?.name || movement.createdById}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--color-text-muted)' }}>No stock movements recorded yet.</p>
        )}
      </div>
    </div>
  );
}
