import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLE_HOME } from '../utils/constants';
import { hasErrors, validateLogin } from '../utils/validate';

const COPY = {
  customer: {
    title: 'Welcome back',
    subtitle: 'Sign in to place orders and track your deliveries.',
    submit: 'Sign in',
    demo: 'demo@tripti.com / 123456',
    switchText: 'New to Tripti?',
    switchLabel: 'Create a customer account',
    switchTo: '/signup',
  },
  restaurant: {
    title: 'Restaurant login',
    subtitle: 'Manage your menu, availability and incoming orders.',
    submit: 'Open dashboard',
    demo: 'owner@tripti.com / 123456',
    switchText: 'Want to join as a partner?',
    switchLabel: 'Register your restaurant',
    switchTo: '/restaurant/signup',
  },
  rider: {
    title: 'Rider login',
    subtitle: 'Pick up ready orders and manage your deliveries.',
    submit: 'Open rider dashboard',
    demo: 'rider@tripti.com / 123456',
    switchText: 'New rider?',
    switchLabel: 'Create a rider account',
    switchTo: '/rider/signup',
  },
};

export default function LoginPage({ role = 'customer' }) {
  const copy = COPY[role];
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateLogin(form.email, form.password);
    setErrors(found);
    if (hasErrors(found)) return;

    setSubmitting(true);
    setServerError('');
    try {
      const user = await login(form.email, form.password, role);
      toast(`Welcome back, ${user.name.split(' ')[0]}`);
      const redirect = role === 'customer' ? location.state?.from || '/' : ROLE_HOME[role];
      navigate(redirect, { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <div className="space-y-2">
          <p>
            {copy.switchText}{' '}
            <Link to={copy.switchTo} className="font-semibold text-brand-700 hover:underline">
              {copy.switchLabel}
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            Partner pages: <Link to="/login" className="hover:text-brand-700">customer</Link>
            {' · '}
            <Link to="/restaurant/login" className="hover:text-brand-700">restaurant</Link>
            {' · '}
            <Link to="/rider/login" className="hover:text-brand-700">rider</Link>
          </p>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {serverError}
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
          />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="Enter your password"
            value={form.password}
            onChange={update('password')}
          />
          {errors.password && <p className="error-text">{errors.password}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Signing in…' : copy.submit}
        </button>

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-bold text-slate-600">Demo account:</span> {copy.demo}
        </div>
      </form>
    </AuthLayout>
  );
}
