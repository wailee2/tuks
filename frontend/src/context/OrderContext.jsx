import { createContext, useState, useEffect } from 'react';
import { fetchOrders } from '../services/order.js';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Load Orders Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <OrderContext.Provider value={{ orders, loading, loadOrders }}>
      {children}
    </OrderContext.Provider>
  );
};
