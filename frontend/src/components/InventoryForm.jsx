import { useState, useEffect } from "react";

export default function InventoryForm({ onSave, product, onCancel }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setQuantity(product.quantity);
      setPrice(product.price);
    } else {
      setName("");
      setQuantity("");
      setPrice("");
    }
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !quantity || !price) return;
    onSave({ name, quantity, price });
    setName("");
    setQuantity("");
    setPrice("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800">
        {product ? "Edit Product" : "Add New Product"}
      </h2>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition flex-1"
        >
          {product ? "Update" : "Add"}
        </button>
        {product && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition flex-1"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
