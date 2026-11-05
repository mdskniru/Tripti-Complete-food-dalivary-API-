import { Link, useLocation, useParams } from 'react-router-dom';
import OrderItems from '../components/OrderItems';
import StatusBadge from '../components/StatusBadge';
import { useOrders } from '../context/OrdersContext';
import { money } from '../utils/format';

export default function OrderSuccess() {
  const { code } = useParams();
  const location = useLocation();
  const { orders } = useOrders();
  const order = location.state?.order || orders.find((item) => item.code === code);

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl">
        <div className="card overflow-hidden">
          <div className="bg-slate-900 px-6 py-10 text-center text-white">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 ring-8 ring-emerald-500/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-8 w-8">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1 className="mt-4 text-2xl font-black">Order placed successfully</h1>
            <p className="mt-1 text-sm text-slate-300">
              The restaurant will confirm your order shortly. Keep this code handy.
            </p>
          </div>

          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Order code</p>
                <p className="text-xl font-black tracking-wide text-slate-900">{code}</p>
              </div>
              <StatusBadge status={order?.status || 'Placed'} />
            </div>

            {order && (
              <>
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Restaurant</span>
                    <span className="text-right font-semibold text-slate-800">{order.restaurantName}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-slate-500">Deliver to</span>
                    <span className="text-right font-semibold text-slate-800">{order.address}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-slate-500">Payment</span>
                    <span className="font-semibold text-emerald-700">Cash on Delivery</span>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-sm font-bold text-slate-800">Items</p>
                  <OrderItems items={order.items} />
                </div>

                <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                  <span className="font-bold text-slate-900">Total to pay</span>
                  <span className="font-black text-slate-900">{money(order.total)}</span>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to="/my-orders" className="btn-primary flex-1">Track my order</Link>
              <Link to="/" className="btn-outline flex-1">Back to menu</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
