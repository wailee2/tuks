// pages/Inventory.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InventoryList from '../components/inventory/InventoryList';
import { getUserInventory } from '../services/inventory';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getUserInventory();
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    // navigate to the edit page for product
    navigate(`/inventory/${product.id}/edit`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-gray-500">Manage your products — add, edit or remove items.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/inventory/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          >
            {/* optional icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <InventoryList
          products={products}
          onEdit={handleEdit}
          fetchProducts={fetchProducts}
          loading={loading}
        />
      </div>
    </div>
  );
}
