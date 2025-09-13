import { useState, useEffect } from 'react';
import { addProduct, updateProduct } from '../services/inventory';

export default function InventoryForm({ fetchProducts, editingProduct, setEditingProduct }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    supplier_id: '',
    purchase_price: 0,
    retail_price: 0,
    stock_quantity: 0,
    reorder_level: 0,
    market_price: 0,
    is_available: false,
  });

  useEffect(() => {
    if (editingProduct) {
      setForm({ ...editingProduct });
    } else {
      setForm({
        name: '',
        description: '',
        category: '',
        supplier_id: '',
        purchase_price: 0,
        retail_price: 0,
        stock_quantity: 0,
        reorder_level: 0,
        market_price: 0,
        is_available: false,
      });
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        purchase_price: Number(form.purchase_price),
        retail_price: Number(form.retail_price),
        stock_quantity: Number(form.stock_quantity),
        reorder_level: Number(form.reorder_level),
        market_price: Number(form.market_price),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        setEditingProduct(null);
      } else {
        await addProduct(payload);
      }

      setForm({
        name: '',
        description: '',
        category: '',
        supplier_id: '',
        purchase_price: 0,
        retail_price: 0,
        stock_quantity: 0,
        reorder_level: 0,
        market_price: 0,
        is_available: false,
      });

      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Failed to save product');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-2">
        {editingProduct ? 'Edit Product' : 'Add Product'}
      </h2>

      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="border p-2 rounded" />
      <input name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border p-2 rounded" />
      <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="border p-2 rounded" />
      <input name="supplier_id" placeholder="Supplier ID" value={form.supplier_id} onChange={handleChange} className="border p-2 rounded" />
      <input name="purchase_price" type="number" placeholder="Purchase Price" value={form.purchase_price} onChange={handleChange} className="border p-2 rounded" />
      <input name="retail_price" type="number" placeholder="Retail Price" value={form.retail_price} onChange={handleChange} className="border p-2 rounded" />
      <input name="stock_quantity" type="number" placeholder="Stock Quantity" value={form.stock_quantity} onChange={handleChange} className="border p-2 rounded" />
      <input name="reorder_level" type="number" placeholder="Reorder Level" value={form.reorder_level} onChange={handleChange} className="border p-2 rounded" />
      <input name="market_price" type="number" placeholder="Market Price" value={form.market_price} onChange={handleChange} className="border p-2 rounded" />

      <label className="flex items-center gap-2">
        <input name="is_available" type="checkbox" checked={form.is_available} onChange={handleChange} />
        Available in Marketplace
      </label>

      <button type="submit" className="bg-green-500 text-white p-2 rounded">
        {editingProduct ? 'Update' : 'Add'} Product
      </button>
    </form>
  );
}
