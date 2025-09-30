// pages/Inventory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    navigate(`/inventory/${product.id}/edit`, { state: { product } });
  };

  return (
    <div className="p-7 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="text-sm text-gray-400">Manage your products — add, edit or remove items.</p>
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
