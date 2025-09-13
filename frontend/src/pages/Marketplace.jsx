import { useEffect, useState } from 'react';
import { fetchMarketplaceProducts } from '../services/inventory';
import MarketplaceCard from '../components/MarketplaceCard';

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketplaceProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
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
      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No products available in the marketplace.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <MarketplaceCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
