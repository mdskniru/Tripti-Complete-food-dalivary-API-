import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">
              T
            </span>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Tripti
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            A complete food delivery demo built with React, PHP and MySQL on
            XAMPP.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Customers</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link to="/" className="hover:text-brand-700">
                Browse menu
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-brand-700">
                Your cart
              </Link>
            </li>
            <li>
              <Link to="/my-orders" className="hover:text-brand-700">
                My orders
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Partners</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link to="/restaurant/signup" className="hover:text-brand-700">
                Register a restaurant
              </Link>
            </li>
            <li>
              <Link to="/restaurant/login" className="hover:text-brand-700">
                Restaurant login
              </Link>
            </li>
            <li>
              <Link to="/rider/signup" className="hover:text-brand-700">
                Become a rider
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Good to know</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>Cash on Delivery only</li>
            <li>Delivery fee BDT 50</li>
            <li>Mirpur, Bangladesh</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-slate-400 sm:flex-row">
          {/* <span>
            © {new Date().getFullYear()} developer Information- Md Shahariar
            Khan
          </span> */}
          <span>Developer Information- Md Shahariar Khan</span>

          <span>React · Vite · Tailwind CSS · PHP · MySQL</span>
        </div>
      </div>
    </footer>
  );
}
