// pages/InventoryPage.jsx
import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/inventory";
import InventoryForm from "../components/InventoryForm";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSave = async (product) => {
    try {
      if (editing) await updateProduct(editing.id, product);
      else await createProduct(product);
      setEditing(null);
      loadProducts();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try { await deleteProduct(id); loadProducts(); } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Inventory</h1>
      <InventoryForm onSave={handleSave} product={editing} onCancel={() => setEditing(null)} />
      <ul className="mt-4 space-y-2">
        {products.map(p => (
          <li key={p.id} className="flex justify-between items-center border p-2 rounded">
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-gray-600">Qty: {p.quantity} | Price: ₦{p.price}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(p)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
