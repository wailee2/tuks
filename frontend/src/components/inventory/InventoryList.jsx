// components/inventory/InventoryList.jsx
import React, { useState, useMemo } from 'react';
import { deleteProduct } from '../../services/inventory';
import { useToasts } from '../../context/ToastContext';
import LoadingSpinner from "../LoadingSpinner";

export default function InventoryList({ products = [], onEdit, fetchProducts, loading }) {
  const { addToast } = useToasts();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // default sort

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(id);
      addToast('Product deleted', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      addToast('Failed to delete product', 'error');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products || [];
    if (q) {
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'stock') return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      if (sortBy === 'price') return (b.retail_price || 0) - (a.retail_price || 0);
      return 0;
    });
    return list;
  }, [products, query, sortBy]);

  if (loading) return <LoadingSpinner message="Loading inventory..." />;

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or category"
            className="border rounded px-3 py-2 w-64"
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded px-2 py-2">
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock (desc)</option>
            <option value="price">Sort: Price (desc)</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">{filtered.length} items</div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No products found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b">
                <th className="p-3">Name</th>
                <th className="p-3 hidden sm:table-cell">Category</th>
                <th className="p-3">Stock</th>
                <th className="p-3 hidden md:table-cell">Retail</th>
                <th className="p-3">Available</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-3 align-top">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.description}</div>
                  </td>
                  <td className="p-3 hidden sm:table-cell align-top">{product.category}</td>
                  <td className="p-3 align-top">{product.stock_quantity}</td>
                  <td className="p-3 hidden md:table-cell align-top">${product.retail_price}</td>
                  <td className="p-3 align-top">{product.is_available ? 'Yes' : 'No'}</td>
                  <td className="p-3 align-top text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit && onEdit(product)}
                      className="px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-500 text-white text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
