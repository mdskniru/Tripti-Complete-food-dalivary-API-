import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import OrderItems from '../components/OrderItems';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useToast } from '../context/ToastContext';
import { money } from '../utils/format';
import { hasErrors, isPhone } from '../utils/validate';

export default function Checkout() {
  const { currentUser } = useAuth();
  const { items, subtotal, deliveryFee, total, count, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  if (!items.length) {
    return (
      <div className="container-page py-12">
        <EmptyState
          title="Nothing to check out"
          description="Your cart is empty. Add some dishes first."
          action={<Link to="/" className="btn-primary">Browse menu</Link>}
        />
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!form.name.trim()) found.name = 'Please enter the recipient name';
    if (!isPhone(form.phone)) found.phone = 'Enter a valid phone number';
    if (!form.address.trim()) found.address = 'Please enter the delivery address';
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    setServerError('');
    try {
      const order = await placeOrder({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        items: items.map((item) => ({ foodId: item.food.id, qty: item.qty })),
      });
      clearCart();
      toast('Order placed successfully');
      navigate(`/order-success/${order.code}`, { replace: true, state: { order } });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Almost there</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">Confirm your delivery details and place the order.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {serverError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {serverError}
            </div>
          )}

          <section className="card p-5">
            <h2 className="text-lg font-bold text-slate-900">Delivery details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="label">Recipient name</label>
                <input id="name" className="input" value={form.name} onChange={update('name')} placeholder="Full name" />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="label">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder="98XXXXXXXX"
                />
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="address" className="label">Delivery address</label>
                <textarea
                  id="address"
                  rows="2"
                  className="input resize-none"
                  value={form.address}
                  onChange={update('address')}
                  placeholder="Street, area, city"
                />
                {errors.address && <p className="error-text">{errors.address}</p>}
              </div>
              <div>
                <label htmlFor="note" className="label">Order note (optional)</label>
                <textarea
                  id="note"
                  rows="2"
                  className="input resize-none"
                  value={form.note}
                  onChange={update('note')}
                  placeholder="Landmark, gate number or special instructions"
                />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-bold text-slate-900">Payment method</h2>
            <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-brand-500 bg-brand-50/60 p-4">
              <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-brand-600 bg-white">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
              </span>
              <div>
                <p className="font-bold text-slate-900">Cash on Delivery</p>
                <p className="text-sm text-slate-500">Pay the rider in cash when your order arrives.</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">Card and online payments are not available in this demo.</p>
          </section>
        </div>

        <aside className="card sticky top-24 p-5">
          <h2 className="text-lg font-bold text-slate-900">Your order</h2>
          <p className="mt-1 text-xs text-slate-500">{count} item{count === 1 ? '' : 's'}</p>
          <div className="mt-3">
            <OrderItems
              items={items.map((item) => ({
                foodId: item.food.id,
                name: item.food.name,
                price: item.food.price,
                qty: item.qty,
              }))}
            />
          </div>
          <dl className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
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
          <button type="submit" disabled={submitting} className="btn-primary mt-4 w-full">
            {submitting ? 'Placing order…' : `Place order · ${money(total)}`}
          </button>
          <Link to="/cart" className="btn-outline mt-2 w-full">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
