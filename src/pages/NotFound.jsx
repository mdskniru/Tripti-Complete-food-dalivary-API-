import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-6xl font-black text-brand-500">404</p>
      <h1 className="mt-3 text-2xl font-black text-slate-900">This page is off the menu</h1>
      <p className="mt-2 text-sm text-slate-500">The page you are looking for does not exist or was moved.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="btn-primary">Back to menu</Link>
        <Link to="/cart" className="btn-outline">View cart</Link>
      </div>
    </div>
  );
}
