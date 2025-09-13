import { useEffect, useState } from 'react';
import { fetchMarketplaceProducts } from '../services/inventory';
import { useNavigate } from 'react-router-dom';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketplaceProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
      alert('Failed to load marketplace products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Marketplace</h2>
      <button
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded"
        onClick={() => navigate('/cart')}
      >
        Go to Cart
      </button>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products available in the marketplace.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border p-4 rounded shadow">
              <h3 className="font-bold">{p.name}</h3>
              <p>Price: ₦{p.market_price}</p>
              <button
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => {
                  // Save to localStorage cart
                  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                  const existing = cart.find((item) => item.product_id === p.id);
                  if (existing) {
                    existing.quantity += 1;
                  } else {
                    cart.push({ product_id: p.id, name: p.name, price: p.market_price, quantity: 1 });
                  }
                  localStorage.setItem('cart', JSON.stringify(cart));
                  alert(`${p.name} added to cart`);
                }}
                disabled={!p.available}
              >
                {p.available ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
