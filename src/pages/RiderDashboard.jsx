import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import OrderItems from '../components/OrderItems';
import PageLoader from '../components/PageLoader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useToast } from '../context/ToastContext';
import { formatDate, money } from '../utils/format';

const ACTIVE_STATUSES = ['Picked Up', 'On the Way'];

export default function RiderDashboard() {
  const { currentUser } = useAuth();
  const { orders, available, loading, error, refresh, updateStatus } = useOrders();
  const { toast } = useToast();
  const [busy, setBusy] = useState('');

  const active = useMemo(
    () => orders.filter((order) => ACTIVE_STATUSES.includes(order.status)),
    [orders]
  );
  const history = useMemo(
    () => orders.filter((order) => order.status === 'Delivered'),
    [orders]
  );

  const changeStatus = async (code, status) => {
    setBusy(`${code}:${status}`);
    try {
      await updateStatus(code, status);
      if (status === 'Picked Up') toast(`Order ${code} assigned to you`);
      else if (status === 'On the Way') toast('Delivery started');
      else toast('Order delivered successfully');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-xl font-black text-brand-700">
            {currentUser?.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Rider dashboard</p>
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{currentUser?.name}</h1>
            <p className="text-xs text-slate-500">
              {currentUser?.vehicleType} · {currentUser?.phone}
            </p>
          </div>
        </div>
        <button type="button" onClick={refresh} disabled={loading} className="btn-outline">
          {loading ? 'Refreshing…' : 'Refresh orders'}
        </button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Available pickups</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{available.length}</p>
          <p className="text-xs text-slate-500">Ready and unclaimed</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Active deliveries</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{active.length}</p>
          <p className="text-xs text-slate-500">Assigned to you</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Completed</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{history.length}</p>
          <p className="text-xs text-slate-500">Delivered orders</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading && !available.length && !orders.length ? (
        <PageLoader label="Loading deliveries…" />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-900">Ready for pickup</h2>
            {available.length === 0 ? (
              <EmptyState
                title="No pickups available"
                description="Orders marked ready by restaurants will appear here. Pull to refresh in a moment."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {available.map((order) => (
                  <article key={order.code} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black tracking-wide text-slate-900">{order.code}</h3>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">Ready since {formatDate(order.updatedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Collect (COD)</p>
                        <p className="text-lg font-black text-slate-900">{money(order.total)}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pick up from</p>
                        <p className="font-semibold text-slate-800">{order.restaurantName}</p>
                        <p className="text-slate-500">{order.restaurantAddress}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Deliver to</p>
                        <p className="font-semibold text-slate-800">{order.customerName} · {order.phone}</p>
                        <p className="text-slate-500">{order.address}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Items</p>
                        <OrderItems items={order.items} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeStatus(order.code, 'Picked Up')}
                      disabled={busy === `${order.code}:Picked Up`}
                      className="btn-primary mt-4 w-full"
                    >
                      {busy === `${order.code}:Picked Up` ? 'Claiming…' : 'Pick up this order'}
                    </button>
                    <p className="mt-2 text-center text-[11px] text-slate-400">
                      Picking up assigns the order to you and hides it from other riders.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-900">Your active deliveries</h2>
            {active.length === 0 ? (
              <EmptyState
                title="No active deliveries"
                description="Pick up an order above to start a delivery."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {active.map((order) => (
                  <article key={order.code} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black tracking-wide text-slate-900">{order.code}</h3>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">Updated {formatDate(order.updatedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Collect (COD)</p>
                        <p className="text-lg font-black text-slate-900">{money(order.total)}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Restaurant</p>
                        <p className="font-semibold text-slate-800">{order.restaurantName}</p>
                        <p className="text-slate-500">{order.restaurantAddress}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Customer</p>
                        <a href={`tel:${order.phone}`} className="font-semibold text-brand-700 hover:underline">
                          {order.customerName} · {order.phone}
                        </a>
                        <p className="text-slate-500">{order.address}</p>
                        {order.note && (
                          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                            Note: {order.note}
                          </p>
                        )}
                      </div>
                      <OrderItems items={order.items} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.status === 'Picked Up' && (
                        <button
                          type="button"
                          onClick={() => changeStatus(order.code, 'On the Way')}
                          disabled={busy === `${order.code}:On the Way`}
                          className="btn-primary flex-1"
                        >
                          {busy === `${order.code}:On the Way` ? 'Updating…' : 'Start delivery'}
                        </button>
                      )}
                      {order.status === 'On the Way' && (
                        <button
                          type="button"
                          onClick={() => changeStatus(order.code, 'Delivered')}
                          disabled={busy === `${order.code}:Delivered`}
                          className="btn-primary flex-1"
                        >
                          {busy === `${order.code}:Delivered` ? 'Updating…' : 'Mark as delivered'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-900">Delivery history</h2>
            {history.length === 0 ? (
              <EmptyState
                title="No completed deliveries yet"
                description="Delivered orders will be listed here with their earnings."
              />
            ) : (
              <div className="space-y-3">
                {history.map((order) => (
                  <article key={order.code} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{order.code}</h3>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {order.restaurantName} → {order.address}
                      </p>
                      <p className="text-xs text-slate-400">Delivered {formatDate(order.updatedAt)}</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{money(order.total)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
