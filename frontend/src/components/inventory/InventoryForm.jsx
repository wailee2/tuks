//components/inventory/InventoryForm.jsx
import React, { useEffect, useState } from 'react';
import { addProduct, updateProduct } from '../../services/inventory';
import { useToasts } from '../../context/ToastContext';

export default function InventoryForm({ initialData = null, mode = 'create', onSuccess = () => {} }) {
  const { addToast } = useToasts();
  const [submitting, setSubmitting] = useState(false);

  const empty = {
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
  };

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

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
      setForm(empty);
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required.';
    if (Number(form.retail_price) < 0) e.retail_price = 'Must be 0 or greater.';
    if (Number(form.purchase_price) < 0) e.purchase_price = 'Must be 0 or greater.';
    if (Number(form.stock_quantity) < 0) e.stock_quantity = 'Must be 0 or greater.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // clear error on change
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleReset = () => {
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
      setForm(empty);
    }
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Product' : 'Add Product'}</h2>
        <div className="flex items-center gap-3">
          {/* Availability switch (live preview) */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">Available</span>
            <label htmlFor="is_available" className="relative inline-flex items-center cursor-pointer">
              <input
                id="is_available"
                name="is_available"
                type="checkbox"
                checked={form.is_available}
                onChange={handleChange}
                className="sr-only"
                aria-checked={form.is_available}
              />
              <span
                className={`w-11 h-6 inline-block rounded-full transition-all ring-0 ${
                  form.is_available ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
              <span
                aria-hidden
                className={`absolute left-0 top-0 w-6 h-6 transform transition-transform rounded-full bg-white shadow ${
                  form.is_available ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Grid fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-green-300 ${
              errors.name ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder="e.g. 12V Lithium Battery"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <input
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="e.g. Batteries"
          />
        </div>

        <div>
          <label htmlFor="supplier_id" className="block text-sm font-medium mb-1">
            Supplier ID
          </label>
          <input
            id="supplier_id"
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder="Numeric supplier id or leave blank"
          />
        </div>

        <div>
          <label htmlFor="stock_quantity" className="block text-sm font-medium mb-1">
            Stock Quantity
          </label>
          <input
            id="stock_quantity"
            name="stock_quantity"
            type="number"
            min={0}
            value={form.stock_quantity}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-green-300 ${
              errors.stock_quantity ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.stock_quantity && <p className="mt-1 text-xs text-red-600">{errors.stock_quantity}</p>}
        </div>

        {/* Price fields - grouped with currency prefix */}
        <div>
          <label htmlFor="purchase_price" className="block text-sm font-medium mb-1">
            Purchase Price (₦)
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-200 bg-gray-50">₦</span>
            <input
              id="purchase_price"
              name="purchase_price"
              type="number"
              min={0}
              step="0.01"
              value={form.purchase_price}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-r border focus:outline-none focus:ring-2 focus:ring-green-300 ${
                errors.purchase_price ? 'border-red-400' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.purchase_price && <p className="mt-1 text-xs text-red-600">{errors.purchase_price}</p>}
        </div>

        <div>
          <label htmlFor="retail_price" className="block text-sm font-medium mb-1">
            Retail Price (₦)
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-200 bg-gray-50">₦</span>
            <input
              id="retail_price"
              name="retail_price"
              type="number"
              min={0}
              step="0.01"
              value={form.retail_price}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-r border focus:outline-none focus:ring-2 focus:ring-green-300 ${
                errors.retail_price ? 'border-red-400' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.retail_price && <p className="mt-1 text-xs text-red-600">{errors.retail_price}</p>}
        </div>

        <div>
          <label htmlFor="market_price" className="block text-sm font-medium mb-1">
            Market Price (₦)
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-200 bg-gray-50">₦</span>
            <input
              id="market_price"
              name="market_price"
              type="number"
              min={0}
              step="0.01"
              value={form.market_price}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-r border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reorder_level" className="block text-sm font-medium mb-1">
            Reorder Level
          </label>
          <input
            id="reorder_level"
            name="reorder_level"
            type="number"
            min={0}
            value={form.reorder_level}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
          />
          <p className="mt-1 text-xs text-gray-500">When stock drops below this number, consider re-ordering.</p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={form.description}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
          placeholder="Short description, details, SKU, dimensions, etc."
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        >
          {submitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update Product' : 'Add Product')}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="flex-1 sm:flex-none px-4 py-2 border rounded text-sm bg-white"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={() => {
            // quick duplicate: copy current form to create a new product (useful for variant creation)
            const duplicate = { ...form, name: form.name ? `${form.name} (Copy)` : '' };
            setForm(duplicate);
            addToast('Duplicated fields — edit then submit to create a new product', 'info');
          }}
          className="ml-auto text-sm px-3 py-2 border rounded bg-gray-50"
        >
          Duplicate
        </button>
      </div>
    </form>
  );
}
