import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api';

const FoodsContext = createContext(null);
export const useFoods = () => useContext(FoodsContext);

export function FoodsProvider({ children }) {
  const [foods, setFoods] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.catalog();
      setFoods(data.foods || []);
      setRestaurants(data.restaurants || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addFood = async (payload) => {
    const { food } = await api.addFood(payload);
    setFoods((prev) => [...prev, food]);
    return food;
  };

  const updateFood = async (id, patch) => {
    const { food } = await api.updateFood({ id, ...patch });
    setFoods((prev) => prev.map((item) => (item.id === id ? food : item)));
    return food;
  };

  const deleteFood = async (id) => {
    await api.deleteFood(id);
    setFoods((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <FoodsContext.Provider value={{ foods, restaurants, loading, error, load, addFood, updateFood, deleteFood }}>
      {children}
    </FoodsContext.Provider>
  );
}
