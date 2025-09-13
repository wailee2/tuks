import { useState } from 'react';
import { placeOrder } from '../services/order.js';

export default function PlaceOrderForm({ items }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePlaceOrder = async () => {
    setLoading(true);
    setMessage('');
    try {
      const orderItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      }));
      const res = await placeOrder(orderItems);
      setMessage(`Order placed successfully! Order ID: ${res.orderId}`);
    } catch (err) {
      console.error('Place Order Error:', err);
      setMessage('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={handlePlaceOrder}
        disabled={loading}
      >
        {loading ? 'Placing...' : 'Place Order'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
