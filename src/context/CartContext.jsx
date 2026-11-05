import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DELIVERY_FEE } from '../utils/constants';
import { useFoods } from './FoodsContext';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const STORAGE_KEY = 'tripti_cart';

export function CartProvider({ children }) {
  const { foods } = useFoods();
  const [items, setItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const detailedItems = useMemo(
    () =>
      items
        .map((item) => ({ ...item, food: foods.find((food) => food.id === item.foodId) }))
        .filter((item) => item.food),
    [items, foods]
  );

  const subtotal = detailedItems.reduce((sum, item) => sum + item.food.price * item.qty, 0);
  const count = detailedItems.reduce((sum, item) => sum + item.qty, 0);
  const deliveryFee = detailedItems.length ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const addItem = (foodId) => {
    const food = foods.find((item) => item.id === foodId);
    if (!food) return { ok: false, error: 'This item is no longer on the menu' };
    if (!food.isOpen) return { ok: false, error: `${food.restaurantName} is currently closed` };
    if (!food.available) return { ok: false, error: `${food.name} is currently unavailable` };

    const cartRestaurant = detailedItems[0]?.food.restaurantId;
    if (cartRestaurant && cartRestaurant !== food.restaurantId) {
      return { ok: false, error: 'Your cart has items from another restaurant. Clear it first.' };
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.foodId === foodId);
      if (existing) {
        return prev.map((item) => (item.foodId === foodId ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { foodId, qty: 1 }];
    });
    return { ok: true };
  };

  const increase = (foodId) => {
    setItems((prev) =>
      prev.map((item) => (item.foodId === foodId ? { ...item, qty: Math.min(item.qty + 1, 20) } : item))
    );
  };

  const decrease = (foodId) => {
    setItems((prev) =>
      prev
        .map((item) => (item.foodId === foodId ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (foodId) => {
    setItems((prev) => prev.filter((item) => item.foodId !== foodId));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items: detailedItems,
        count,
        subtotal,
        deliveryFee,
        total,
        addItem,
        increase,
        decrease,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
