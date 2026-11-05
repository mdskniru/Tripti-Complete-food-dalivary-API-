import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';

const OrdersContext = createContext(null);
export const useOrders = () => useContext(OrdersContext);

export function OrdersProvider({ children }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setOrders([]);
      setAvailable([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.orders();
      setOrders(data.orders || data.mine || []);
      setAvailable(data.available || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const placeOrder = async (payload) => {
    const { order } = await api.placeOrder(payload);
    await refresh();
    return order;
  };

  const updateStatus = async (code, status) => {
    const { order } = await api.setOrderStatus(code, status);
    await refresh();
    return order;
  };

  return (
    <OrdersContext.Provider value={{ orders, available, loading, error, refresh, placeOrder, updateStatus }}>
      {children}
    </OrdersContext.Provider>
  );
}
