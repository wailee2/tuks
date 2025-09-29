// components/inventory/InventoryForm.jsx
import { useState, useEffect } from 'react';
import { addProduct, updateProduct } from '../../services/inventory';
import { useToasts } from '../../context/ToastContext';

export default function InventoryForm({ initialData = null, mode = 'create', onSuccess = () => {} }) {
  const { addToast } = useToasts();
  const [submitting, setSubmitting] = useState(false);

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
    if (initialData) {
      setForm({
        name: initialData.name || '',
        description: initialData.description || '',
        category: initialData.category || '',
        supplier_id: initialData.supplier_id ?? '',
        purchase_price: initialData.purchase_price ?? 0,
        retail_price: initialData.retail_price ?? 0,
        stock_quantity: initialData.stock_quantity ?? 0,
        reorder_level: initialData.reorder_level ?? 0,
        market_price: initialData.market_price ?? 0,
        is_available: Boolean(initialData.is_available),
      });
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
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

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

      if (mode === 'edit' && initialData && initialData.id) {
        await updateProduct(initialData.id, payload);
        addToast('Product updated', 'success');
      } else {
        await addProduct(payload);
        addToast('Product added', 'success');
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving product:', err);
      addToast('Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="border p-2 rounded" />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="border p-2 rounded" />

        <input name="supplier_id" placeholder="Supplier ID" value={form.supplier_id} onChange={handleChange} className="border p-2 rounded" />
        <input name="purchase_price" type="number" placeholder="Purchase Price" value={form.purchase_price} onChange={handleChange} className="border p-2 rounded" />

        <input name="retail_price" type="number" placeholder="Retail Price" value={form.retail_price} onChange={handleChange} className="border p-2 rounded" />
        <input name="market_price" type="number" placeholder="Market Price" value={form.market_price} onChange={handleChange} className="border p-2 rounded" />

        <input name="stock_quantity" type="number" placeholder="Stock Quantity" value={form.stock_quantity} onChange={handleChange} className="border p-2 rounded" />
        <input name="reorder_level" type="number" placeholder="Reorder Level" value={form.reorder_level} onChange={handleChange} className="border p-2 rounded" />
      </div>

      <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} className="border p-2 rounded" rows={3} />

      <label className="flex items-center gap-2 text-sm">
        <input name="is_available" type="checkbox" checked={form.is_available} onChange={handleChange} />
        Available in Marketplace
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        >
          {submitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Product' : 'Add Product')}
        </button>

        <button
          type="button"
          onClick={() => {
            // reset form
            if (initialData) {
              // revert to initial data
              setForm({
                name: initialData.name || '',
                description: initialData.description || '',
                category: initialData.category || '',
                supplier_id: initialData.supplier_id ?? '',
                purchase_price: initialData.purchase_price ?? 0,
                retail_price: initialData.retail_price ?? 0,
                stock_quantity: initialData.stock_quantity ?? 0,
                reorder_level: initialData.reorder_level ?? 0,
                market_price: initialData.market_price ?? 0,
                is_available: Boolean(initialData.is_available),
              });
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
          }}
          className="px-4 py-2 border rounded text-sm"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
