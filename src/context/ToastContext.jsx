import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-soft ${
              item.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            <span aria-hidden="true">{item.type === 'error' ? '!' : '✓'}</span>
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
