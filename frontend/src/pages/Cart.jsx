import { useEffect, useState } from 'react';
import { placeOrder } from '../services/order';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(storedCart);
  }, []);

  const updateQuantity = (product_id, qty) => {
    const newCart = cart.map((item) =>
      item.product_id === product_id ? { ...item, quantity: qty } : item
    ).filter(item => item.quantity > 0);
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Cart is empty');
    try {
      await placeOrder(cart.map(({ product_id, quantity }) => ({ product_id, quantity })));
      alert('Order placed successfully!');
      setCart([]);
      localStorage.removeItem('cart');
      navigate('/marketplace');
    } catch (err) {
      console.error('Order failed:', err);
      alert('Failed to place order');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.product_id} className="flex justify-between items-center border p-2 rounded">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p>₦{item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 bg-gray-200 rounded"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  >-</button>
                  <span>{item.quantity}</span>
                  <button
                    className="px-2 bg-gray-200 rounded"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 font-bold">Total: ₦{total}</div>
          <button
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
            onClick={handleCheckout}
          >
            Checkout
          </button>
        </>
      )}
    </div>
  );
}
