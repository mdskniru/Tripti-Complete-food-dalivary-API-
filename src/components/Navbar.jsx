import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ROLE_HOME } from '../utils/constants';

function CartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </svg>
  );
}

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { count } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [partnersOpen, setPartnersOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setPartnersOpen(false);
  }, [location.pathname]);

  const dashboardLink = currentUser ? ROLE_HOME[currentUser.role] : '/';
  const dashboardLabel =
    currentUser?.role === 'restaurant'
      ? 'Restaurant dashboard'
      : currentUser?.role === 'rider'
        ? 'Rider dashboard'
        : 'My Orders';

  const handleLogout = async () => {
    await logout();
    toast('You have been signed out');
    navigate('/');
  };

  const cartBadge = count > 0 && (
    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white">T</span>
          <span className="text-xl font-black tracking-tight text-slate-900">Tripti</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Menu
          </NavLink>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPartnersOpen((open) => !open)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-expanded={partnersOpen}
            >
              For Partners
              <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition ${partnersOpen ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            {partnersOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Restaurants</p>
                <Link to="/restaurant/login" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Restaurant login
                </Link>
                <Link to="/restaurant/signup" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Register a restaurant
                </Link>
                <div className="my-2 border-t border-slate-100" />
                <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Riders</p>
                <Link to="/rider/login" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Rider login
                </Link>
                <Link to="/rider/signup" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Become a rider
                </Link>
              </div>
            )}
          </div>
          <Link
            to="/cart"
            className="relative ml-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <CartIcon />
            Cart
            {cartBadge}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand-300"
                aria-expanded={accountOpen}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[110px] truncate">{currentUser.name}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 text-slate-400 transition ${accountOpen ? 'rotate-180' : ''}`}>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                    <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
                    <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {currentUser.role}
                    </p>
                  </div>
                  <div className="my-1 border-t border-slate-100" />
                  <Link to={dashboardLink} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    {dashboardLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-outline px-4 py-2">
                Login
              </Link>
              <Link to="/signup" className="btn-primary px-4 py-2">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-50" aria-label="Cart">
            <CartIcon />
            {cartBadge}
          </Link>
          {currentUser ? (
            <Link
              to={dashboardLink}
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
              aria-label={dashboardLabel}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700">
                Login
              </Link>
              <Link to="/signup" className="rounded-lg bg-brand-600 px-2.5 py-2 text-sm font-semibold text-white">
                Sign Up
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-50"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-0.5 py-3">
            <Link to="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Menu
            </Link>
            <Link to="/cart" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cart {count > 0 ? `(${count})` : ''}
            </Link>
            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">For restaurants</p>
            <Link to="/restaurant/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Restaurant login
            </Link>
            <Link to="/restaurant/signup" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Register a restaurant
            </Link>
            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">For riders</p>
            <Link to="/rider/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Rider login
            </Link>
            <Link to="/rider/signup" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Become a rider
            </Link>
            {currentUser && (
              <>
                <div className="my-2 border-t border-slate-100" />
                <Link to={dashboardLink} className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  {dashboardLabel}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
