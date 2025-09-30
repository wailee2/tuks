// pages/Marketplace.jsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMarketplaceProducts } from '../services/inventory';
import { useToasts } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { AuthContext } from '../context/AuthContext';

const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export default function Marketplace() {
  const { addToast } = useToasts();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext) || {}; // AuthContext exposes `user`

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingIds, setAddingIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('latest');

  // Candidate owner fields - adjust to match your DB canonical owner field
  const ownerFieldCandidates = ['user_id', 'created_by', 'seller_id', 'owner_id', 'userId'];

  const isOwnerOf = (product) => {
    if (!currentUser || !product) return false;
    const ownerId = ownerFieldCandidates.reduce((acc, key) => acc ?? product[key], null);
    if (ownerId == null) return false;
    // Admin override (optional) - uncomment if you use roles
    // if (String(currentUser.role) === 'admin') return true;
    return String(currentUser.id) === String(ownerId);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketplaceProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching marketplace products:', err);
      addToast('Failed to load marketplace products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    let list = products.slice();

    if (q) {
      list = list.filter((p) =>
        ((p.name || '') + ' ' + (p.description || '') + ' ' + (p.category || '')).toLowerCase().includes(q)
      );
    }

    if (sort === 'price-asc') list.sort((a, b) => (a.retail_price || 0) - (b.retail_price || 0));
    if (sort === 'price-desc') list.sort((a, b) => (b.retail_price || 0) - (a.retail_price || 0));
    if (sort === 'latest') list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return list;
  }, [products, query, sort]);

  const addToCart = (product) => {
    if (!product) return;
    const id = product.id;
    setAddingIds((s) => new Set(s).add(id));
    try {
      const cartRaw = localStorage.getItem('cart') || '[]';
      const cart = Array.isArray(JSON.parse(cartRaw)) ? JSON.parse(cartRaw) : [];
      const existing = cart.find((i) => i.product_id === id);
      if (existing) {
        existing.quantity = Math.min((existing.quantity || 0) + 1, product.stock_quantity || 9999);
      } else {
        cart.push({
          product_id: id,
          name: product.name,
          price: product.retail_price,
          quantity: 1,
          thumbnail: product.image_url || product.thumbnail || null,
        });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      addToast(`${product.name} added to cart`, 'success');
    } catch (err) {
      console.error('Add to cart error:', err);
      addToast('Failed to add to cart', 'error');
    } finally {
      setAddingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-500">Discover items from sellers in your network.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <input
              aria-label="Search products"
              placeholder="Search products, categories, descriptions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-80 px-3 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 border rounded"
              aria-label="Sort products"
            >
              <option value="latest">Sort: Latest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/cart')}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
            aria-label="Go to cart"
          >
            Cart
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="bg-white p-6 rounded shadow">
            <LoadingSpinner message="Loading marketplace..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded shadow text-center">
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="mt-2 text-sm text-gray-500">Try clearing your search or check back later.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={loadProducts} className="px-4 py-2 border rounded">
                Refresh
              </button>
              <button onClick={() => navigate('/inventory')} className="px-4 py-2 bg-gray-100 rounded">
                My Inventory
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => {
              const available = Boolean(p.is_available) && (p.stock_quantity == null || p.stock_quantity > 0);
              const adding = addingIds.has(p.id);
              const isOwner = isOwnerOf(p);

              return (
                <article
                  key={p.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-150 flex flex-col overflow-hidden"
                >
                  <div className="relative h-48 w-full bg-gray-50 overflow-hidden">
                    {p.image_url || p.thumbnail ? (
                      <img
                        src={p.image_url || p.thumbnail}
                        alt={p.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="14" rx="2" />
                          <path d="M3 17l4-4 2 2 4-4 6 6" />
                        </svg>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 inline-flex items-center gap-2 bg-white/90 px-2 py-1 rounded text-xs">
                      <span className="font-medium">{p.category || 'General'}</span>
                    </div>

                    {!available && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-lg font-semibold text-gray-600">
                        Out of stock
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-lg font-medium leading-tight text-gray-900">{p.name}</h4>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{p.description || ''}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500">Price</div>
                        <div className="text-lg font-semibold">{NGN.format(p.retail_price || 0)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">
                        <div>Stock: <span className="font-medium">{p.stock_quantity ?? '—'}</span></div>
                        <div>Seller: <span className="font-medium">{p.seller_name || p.seller || 'Unknown'}</span></div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToCart(p)}
                          disabled={!available || adding}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition ${
                            !available ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          aria-disabled={!available}
                        >
                          {adding ? 'Adding...' : available ? 'Add to Cart' : 'Out of Stock'}
                        </button>

                        <button
                          onClick={() => navigate(`/marketplace/${p.id}`, { state: { product: p } })}
                          className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
                        >
                          View
                        </button>
                        {/**
                        {isOwner && (
                          <button
                            onClick={() => navigate(`/inventory/${p.id}/edit`, { state: { product: p } })}
                            className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-sm"
                          >
                            Edit
                          </button>
                        )} */}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
