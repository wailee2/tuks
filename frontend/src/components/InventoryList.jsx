import React, { useState } from 'react';
import { deleteProduct } from '../services/inventory';
import { useToasts } from '../context/ToastContext';
import LoadingSpinner from "../components/LoadingSpinner";

export default function InventoryList({ products, setEditingProduct, fetchProducts }) {
  const { addToast } = useToasts();
  const [loading, setLoading] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      await deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      //alert('Failed to delete product');
      addToast('Failed to delete product', 'error');
    } finally {
      setLoading(false); // stop spinner
    }
  };

  if (loading) {
    return <LoadingSpinner message="." />;
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Your Inventory</h2>
      {products.length === 0 ? (
        <p>No products added.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2">Retail Price</th>
              <th className="border p-2">Available</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="border p-2">{product.name}</td>
                <td className="border p-2">{product.category}</td>
                <td className="border p-2">{product.stock_quantity}</td>
                <td className="border p-2">${product.retail_price}</td>
                <td className="border p-2">{product.is_available ? 'Yes' : 'No'}</td>
                <td className="border p-2 flex gap-2">
                  <button onClick={() => setEditingProduct(product)} className="bg-yellow-400 text-white px-2 py-1 rounded">Edit</button>
                  <button onClick={() => handleDelete(product.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
