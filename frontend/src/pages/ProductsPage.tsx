import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Add Product form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('');
  const [location, setLocation] = useState('');

  // Stock Movement inline state
  const [movementProductId, setMovementProductId] = useState<string | null>(null);
  const [movementQty, setMovementQty] = useState('');
  const [movementType, setMovementType] = useState('IN');
  const [movementReason, setMovementReason] = useState('');
  const [movementError, setMovementError] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await client.get(`/products?search=${search}`);
      setProducts(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/products', {
        name, sku, category, location,
        unitPrice: parseFloat(unitPrice),
        minStockAlert: parseInt(minStockAlert) || 0
      });
      setName(''); setSku(''); setCategory(''); setUnitPrice(''); setMinStockAlert(''); setLocation('');
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add product');
    }
  };

  const handleStockMovement = async (e: React.FormEvent, productId: string) => {
    e.preventDefault();
    setMovementError('');
    try {
      await client.post(`/products/${productId}/stock-movement`, {
        quantity: parseInt(movementQty),
        movementType,
        reason: movementReason
      });
      setMovementProductId(null);
      setMovementQty('');
      setMovementReason('');
      fetchProducts();
    } catch (err: any) {
      setMovementError(err.response?.data?.error || 'Failed to record movement');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2>Products & Inventory</h2>
      </div>
      {error && <div className="mb-2" style={{ color: 'var(--color-danger)', background: '#fee2e2', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}

      <div className="card">
        <form onSubmit={handleAddProduct} className="form-row" style={{ flexWrap: 'wrap' }}>
          <h3 style={{ width: '100%', marginBottom: 'var(--space-sm)' }}>Add Product</h3>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Name</label>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>SKU</label>
            <input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Category</label>
            <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 150px' }}>
            <label>Unit Price</label>
            <input type="number" step="0.01" placeholder="Unit Price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
          </div>
          <div className="form-group" style={{ flex: '1 1 150px' }}>
            <label>Min Stock Alert</label>
            <input type="number" placeholder="Min Stock Alert" value={minStockAlert} onChange={e => setMinStockAlert(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Location</label>
            <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: '1 1 100%', alignItems: 'flex-start' }}>
            <button type="submit" className="primary">Add Product</button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="mb-3" style={{ maxWidth: '300px' }}>
          <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Current Stock</th>
            <th>Min Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p: any) => {
            const isLowStock = p.currentStock <= p.minStockAlert;
            return (
              <tr key={p.id} style={{ backgroundColor: isLowStock ? '#fee2e2' : 'transparent' }}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category}</td>
                <td>{p.unitPrice}</td>
                <td>
                  <span className={`badge ${isLowStock ? 'red' : 'green'}`}>
                    {p.currentStock}
                  </span>
                </td>
                <td>{p.minStockAlert}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link to={`/products/${p.id}`} style={{ fontWeight: 500 }}>View / Edit</Link>
                    {movementProductId === p.id ? (
                      <form onSubmit={(e) => handleStockMovement(e, p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                        {movementError && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{movementError}</span>}
                        <select value={movementType} onChange={e => setMovementType(e.target.value)} style={{ width: '80px', padding: '0.25rem' }}>
                          <option value="IN">IN</option>
                          <option value="OUT">OUT</option>
                        </select>
                        <input type="number" placeholder="Qty" value={movementQty} onChange={e => setMovementQty(e.target.value)} required min="1" style={{ width: '70px', padding: '0.25rem' }} />
                        <input placeholder="Reason" value={movementReason} onChange={e => setMovementReason(e.target.value)} style={{ width: '150px', padding: '0.25rem' }} />
                        <button type="submit" className="primary" style={{ padding: '0.25rem 0.5rem' }}>Save</button>
                        <button type="button" className="secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => { setMovementProductId(null); setMovementError(''); }}>Cancel</button>
                      </form>
                    ) : (
                      <button className="secondary" onClick={() => { 
                        setMovementProductId(p.id); 
                        setMovementQty(''); 
                        setMovementReason(''); 
                        setMovementType('IN'); 
                        setMovementError(''); 
                      }}>Record Movement</button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
