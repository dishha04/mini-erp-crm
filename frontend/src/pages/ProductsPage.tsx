import { useState, useEffect } from 'react';
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
      <h2>Products & Inventory</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleAddProduct} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
        <h3>Add Product</h3>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} required />
        <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <input type="number" step="0.01" placeholder="Unit Price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
        <input type="number" placeholder="Min Stock Alert" value={minStockAlert} onChange={e => setMinStockAlert(e.target.value)} />
        <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
        <button type="submit">Add</button>
      </form>

      <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: '1rem' }} />

      <table border={1} cellPadding={5} style={{ borderCollapse: 'collapse', width: '100%' }}>
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
              <tr key={p.id} style={{ backgroundColor: isLowStock ? '#ffcccc' : 'transparent' }}>
                <td>{p.name}</td>
                <td>{p.sku}</td>
                <td>{p.category}</td>
                <td>{p.unitPrice}</td>
                <td>{p.currentStock}</td>
                <td>{p.minStockAlert}</td>
                <td>
                  {movementProductId === p.id ? (
                    <form onSubmit={(e) => handleStockMovement(e, p.id)}>
                      {movementError && <p style={{ color: 'red', fontSize: '12px' }}>{movementError}</p>}
                      <select value={movementType} onChange={e => setMovementType(e.target.value)}>
                        <option value="IN">IN</option>
                        <option value="OUT">OUT</option>
                      </select>
                      <input type="number" placeholder="Qty" value={movementQty} onChange={e => setMovementQty(e.target.value)} required min="1" style={{ width: '60px' }} />
                      <input placeholder="Reason" value={movementReason} onChange={e => setMovementReason(e.target.value)} />
                      <button type="submit">Save</button>
                      <button type="button" onClick={() => { setMovementProductId(null); setMovementError(''); }}>Cancel</button>
                    </form>
                  ) : (
                    <button onClick={() => { 
                      setMovementProductId(p.id); 
                      setMovementQty(''); 
                      setMovementReason(''); 
                      setMovementType('IN'); 
                      setMovementError(''); 
                    }}>Record Movement</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
