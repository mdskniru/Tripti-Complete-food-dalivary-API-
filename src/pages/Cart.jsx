import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import SmartImage from '../components/SmartImage';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money } from '../utils/format';

export default function Cart() {
  const {
    items,
    count,
    subtotal,
    deliveryFee,
    total,
    increase,
    decrease,
    removeItem,
    clearCart,
  } = useCart();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="container-page py-12">
        <EmptyState
          title="Your cart is empty"
          description="Browse the menu and add your favourite dishes to get started."
          action={<Link to="/" className="btn-primary">Browse menu</Link>}
        />
      </div>
    );
  }

  const goToCheckout = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    if (currentUser.role !== 'customer') {
      toast('Please sign in with a customer account to place an order', 'error');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Your order</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Shopping cart</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            clearCart();
            toast('Cart cleared');
          }}
          className="text-sm font-semibold text-slate-500 hover:text-red-600"
        >
          Clear cart
        </button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.food.id} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
              <SmartImage
                src={item.food.image}
                alt={item.food.name}
                className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-slate-900">{item.food.name}</h2>
                    <p className="truncate text-xs text-slate-500">{item.food.restaurantName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.food.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${item.food.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v5M14 11v5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-700">{money(item.food.price)}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <div className="inline-flex items-center rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => decrease(item.food.id)}
                      className="grid h-8 w-8 place-items-center rounded-l-xl text-slate-600 hover:bg-slate-50"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-800">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => increase(item.food.id)}
                      className="grid h-8 w-8 place-items-center rounded-r-xl text-slate-600 hover:bg-slate-50"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">{money(item.food.price * item.qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="card sticky top-24 p-5">
          <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
          <p className="mt-1 text-xs text-slate-500">{count} item{count === 1 ? '' : 's'} from one restaurant</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-semibold text-slate-800">{money(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivery fee</dt>
              <dd className="font-semibold text-slate-800">{money(deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
              <dt className="font-bold text-slate-900">Total</dt>
              <dd className="font-black text-slate-900">{money(total)}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Cash on Delivery · pay when your food arrives
          </div>

          <button type="button" onClick={goToCheckout} className="btn-primary mt-4 w-full">
            Proceed to checkout
          </button>
          <Link to="/" className="btn-outline mt-2 w-full">
            Add more items
          </Link>
          {!currentUser && (
            <p className="mt-3 text-center text-xs text-slate-400">You will be asked to sign in before checkout.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
