import { useContext } from 'react';
import { OrderContext } from '../context/OrderContext';

export default function OrdersList() {
  const { orders, loading } = useContext(OrderContext);

  if (loading) return <p>Loading orders...</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <div key={order.id} className="p-4 border rounded shadow-sm">
          <h3 className="font-bold">Order #{order.id}</h3>
          <p>Total: ${order.total}</p>
          <p>Status: {order.status}</p>
          <p>Created at: {new Date(order.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
