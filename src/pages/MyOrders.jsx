import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import OrderItems from '../components/OrderItems';
import PageLoader from '../components/PageLoader';
import StatusBadge from '../components/StatusBadge';
import { useOrders } from '../context/OrdersContext';
import { TRACK_STEPS } from '../utils/constants';
import { formatDate, money } from '../utils/format';

const FILTERS = ['All', 'Active', 'Delivered', 'Rejected'];

function Tracker({ status }) {
  const current = TRACK_STEPS.indexOf(status);
  return (
    <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-6">
      {TRACK_STEPS.map((step, index) => {
        const done = current >= index;
        return (
          <li key={step} className="flex items-center gap-2 sm:flex-col sm:text-center">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>
            <span className={`text-[11px] font-semibold ${done ? 'text-slate-700' : 'text-slate-400'}`}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function MyOrders() {
  const { orders, loading, error, refresh } = useOrders();
  const [filter, setFilter] = useState('All');

  const visible = useMemo(() => {
    if (filter === 'Active') {
      return orders.filter((order) => !['Delivered', 'Rejected'].includes(order.status));
    }
    if (filter === 'Delivered') return orders.filter((order) => order.status === 'Delivered');
    if (filter === 'Rejected') return orders.filter((order) => order.status === 'Rejected');
    return orders;
  }, [orders, filter]);

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Account</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">My orders</h1>
          <p className="mt-1 text-sm text-slate-500">Follow every order from the kitchen to your door.</p>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="btn-outline">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === item
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading && !orders.length ? (
        <PageLoader label="Loading your orders…" />
      ) : visible.length === 0 ? (
        <EmptyState
          title={orders.length ? 'No orders in this filter' : 'No orders yet'}
          description={
            orders.length
              ? 'Try a different filter to see your other orders.'
              : 'Your placed orders will appear here so you can track them.'
          }
          action={<Link to="/" className="btn-primary">Order something tasty</Link>}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <article key={order.code} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black tracking-wide text-slate-900">{order.code}</h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{order.restaurantName}</p>
                  <p className="text-xs text-slate-400">Placed {formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total (COD)</p>
                  <p className="text-lg font-black text-slate-900">{money(order.total)}</p>
                </div>
              </div>

              <div className="mt-3 grid gap-4 border-t border-slate-100 pt-3 sm:grid-cols-[1fr_240px]">
                <div>
                  <OrderItems items={order.items} />
                </div>
                <div className="text-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Deliver to</p>
                  <p className="mt-1 font-semibold text-slate-800">{order.customerName}</p>
                  <p className="text-slate-500">{order.phone}</p>
                  <p className="text-slate-500">{order.address}</p>
                  {order.note && <p className="mt-1 text-xs italic text-slate-400">Note: {order.note}</p>}
                </div>
              </div>

              {order.status === 'Rejected' ? (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  This order was rejected by the restaurant. You can place a new order from the menu.
                </p>
              ) : (
                <Tracker status={order.status} />
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
