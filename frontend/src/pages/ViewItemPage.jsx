// pages/ViewItemPage.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '../services/inventory';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToasts } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export default function ViewItemPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToasts();
  const { user: currentUser } = useContext(AuthContext) || {};

  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [adding, setAdding] = useState(false);

  const ownerFieldCandidates = ['user_id', 'created_by', 'seller_id', 'owner_id', 'userId'];
  const isOwnerOfProduct = (prod) => {
    if (!currentUser || !prod) return false;
    const ownerId = ownerFieldCandidates.reduce((acc, key) => acc ?? prod[key], null);
    if (ownerId == null) return false;
    // if (String(currentUser.role) === 'admin') return true; // optional admin override
    return String(currentUser.id) === String(ownerId);
  };

  useEffect(() => {
    if (product) return;
    (async () => {
      setLoading(true);
      try {
        const p = await getProductById((id));
        if (!p) {
          addToast('Product not found', 'error');
          navigate('/marketplace');
          return;
        }
        setProduct(p);
      } catch (err) {
        console.error('Failed to load product:', err);
        addToast('Failed to load product', 'error');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="p-6"><LoadingSpinner message="Loading item..." /></div>;
  if (!product) return null;

  const available = Boolean(product.is_available) && (product.stock_quantity == null || product.stock_quantity > 0);
  const isOwner = isOwnerOfProduct(product);

  const addToCart = () => {
    setAdding(true);
    try {
      const cartRaw = localStorage.getItem('cart') || '[]';
      const cart = Array.isArray(JSON.parse(cartRaw)) ? JSON.parse(cartRaw) : [];
      const existing = cart.find((i) => i.product_id === product.id);
      if (existing) {
        existing.quantity = Math.min((existing.quantity || 0) + 1, product.stock_quantity || 9999);
      } else {
        cart.push({
          product_id: product.id,
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
      setAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-gray-500">{product.category || 'General'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/marketplace" className="text-sm text-gray-600 hover:underline">Back to Marketplace</Link>
          {isOwner && (
            <button
              onClick={() => navigate(`/inventory/${product.id}/edit`, { state: { product } })}
              className="px-3 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-sm"
            >
              Edit item
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="h-64 w-full bg-gray-50 rounded overflow-hidden flex items-center justify-center">
            {product.image_url || product.thumbnail ? (
              <img
                src={product.image_url || product.thumbnail}
                alt={product.name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <div>Seller: <span className="font-medium">{product.seller_name || product.seller || 'Unknown'}</span></div>
            <div>Posted: <span className="font-medium">{product.created_at ? new Date(product.created_at).toLocaleDateString() : '—'}</span></div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col">
          <div className="mb-4">
            <div className="text-sm text-gray-500">Price</div>
            <div className="text-2xl font-semibold">{NGN.format(product.retail_price || 0)}</div>
          </div>

          <div className="text-sm text-gray-700 mb-4">{product.description || 'No description provided.'}</div>

          <div className="flex items-center justify-between mt-auto gap-4">
            <div className="text-xs text-gray-500">
              <div>Stock: <span className="font-medium">{product.stock_quantity ?? '—'}</span></div>
              <div>Category: <span className="font-medium">{product.category || 'General'}</span></div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={addToCart}
                disabled={!available || adding}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  !available ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {adding ? 'Adding...' : available ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <button onClick={() => navigate('/cart')} className="px-4 py-2 border rounded text-sm">
                Go to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
