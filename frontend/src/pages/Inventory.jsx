import { useState, useEffect } from 'react';
import InventoryForm from '../components/InventoryForm';
import InventoryList from '../components/InventoryList';
import { getUserInventory } from '../services/inventory';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const data = await getUserInventory();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6">
      {/* Form */}
      <div className="md:w-1/3 bg-white p-4 rounded shadow">
        <InventoryForm
          fetchProducts={fetchProducts}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
        />
      </div>

      {/* List */}
      <div className="md:w-2/3">
        <InventoryList
          products={products}
          setEditingProduct={setEditingProduct}
          fetchProducts={fetchProducts}
        />
      </div>
    </div>
  );
}
