import { useEffect, useState } from 'react';
import { fetchOrderById } from '../services/order.js';
import { useParams } from 'react-router-dom';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await fetchOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error('Load Order Error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id]);

  if (loading) return <p>Loading order...</p>;
  if (!order) return <p>Order not found.</p>;

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Order #{order.order.id}</h2>
      <p>Total: ${order.order.total}</p>
      <p>Status: {order.order.status}</p>
      <p>Created at: {new Date(order.order.created_at).toLocaleString()}</p>
      <h3 className="mt-4 font-semibold">Items:</h3>
      <ul className="list-disc ml-6">
        {order.items.map(item => (
          <li key={item.id}>
            {item.product_name} — Qty: {item.quantity} — Price: ${item.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
