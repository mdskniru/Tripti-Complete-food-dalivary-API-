import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLE_HOME, VEHICLE_TYPES } from '../utils/constants';
import { readImageFile } from '../utils/image';
import { hasErrors, isEmail, isPhone } from '../utils/validate';

const COPY = {
  customer: {
    title: 'Create your account',
    subtitle: 'Order food from your favourite local kitchens in a few taps.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLabel: 'Sign in',
    switchTo: '/login',
  },
  restaurant: {
    title: 'Register your restaurant',
    subtitle: 'Add your menu, receive orders and manage availability.',
    submit: 'Create restaurant account',
    switchText: 'Already registered?',
    switchLabel: 'Restaurant login',
    switchTo: '/restaurant/login',
  },
  rider: {
    title: 'Become a rider',
    subtitle: 'Deliver food in your area and earn on every completed trip.',
    submit: 'Create rider account',
    switchText: 'Already a rider?',
    switchLabel: 'Rider login',
    switchTo: '/rider/login',
  },
};

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
  password: '',
  restaurantName: '',
  vehicleType: 'Bike',
};

export default function SignupPage({ role = 'customer' }) {
  const copy = COPY[role];
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [logo, setLogo] = useState('');
  const [logoError, setLogoError] = useState('');
  const [logoReading, setLogoReading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError('');
    setLogoReading(true);
    try {
      setLogo(await readImageFile(file));
    } catch (error) {
      setLogoError(error.message);
      setLogo('');
    } finally {
      setLogoReading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = {};
    if (!form.name.trim()) found.name = 'Please enter your name';
    if (!isEmail(form.email)) found.email = 'Enter a valid email address';
    if (form.password.length < 6) found.password = 'Password must be at least 6 characters';
    if (!isPhone(form.phone)) found.phone = 'Enter a valid phone number';
    if (role !== 'rider' && !form.address.trim()) found.address = 'Please enter your address';
    if (role === 'restaurant' && !form.restaurantName.trim()) {
      found.restaurantName = 'Please enter your restaurant name';
    }
    setErrors(found);
    if (hasErrors(found)) return;

    const payload = {
      role,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
    };
    if (role !== 'rider') payload.address = form.address.trim();
    if (role === 'restaurant') {
      payload.restaurantName = form.restaurantName.trim();
      if (logo) payload.logo = logo;
    }
    if (role === 'rider') payload.vehicleType = form.vehicleType;

    setSubmitting(true);
    setServerError('');
    try {
      await signup(payload);
      toast('Account created successfully');
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
        <p>
          {copy.switchText}{' '}
          <Link to={copy.switchTo} className="font-semibold text-brand-700 hover:underline">
            {copy.switchLabel}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {serverError}
          </div>
        )}

        {role === 'restaurant' && (
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 p-3">
            {logo ? (
              <img src={logo} alt="Restaurant logo preview" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-50 text-xl font-black text-brand-600">
                {form.restaurantName.charAt(0) || 'R'}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <label htmlFor="logo" className="label mb-1">Restaurant logo (optional)</label>
              <input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogo}
                className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700"
              />
              <p className="mt-1 text-[11px] text-slate-400">JPG, PNG or WEBP · max 2 MB</p>
              {logoReading && <p className="text-[11px] text-slate-400">Reading image…</p>}
              {logoError && <p className="error-text">{logoError}</p>}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="name" className="label">
            {role === 'restaurant' ? 'Owner name' : 'Full name'}
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="input"
            placeholder={role === 'restaurant' ? 'e.g. Ramesh Thapa' : 'e.g. Aarav Shrestha'}
            value={form.name}
            onChange={update('name')}
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        {role === 'restaurant' && (
          <div>
            <label htmlFor="restaurantName" className="label">Restaurant name</label>
            <input
              id="restaurantName"
              type="text"
              className="input"
              placeholder="e.g. Spice Garden"
              value={form.restaurantName}
              onChange={update('restaurantName')}
            />
            {errors.restaurantName && <p className="error-text">{errors.restaurantName}</p>}
          </div>
        )}

        {role === 'rider' && (
          <div>
            <label htmlFor="vehicleType" className="label">Vehicle type</label>
            <select id="vehicleType" className="input" value={form.vehicleType} onChange={update('vehicleType')}>
              {VEHICLE_TYPES.map((vehicle) => (
                <option key={vehicle} value={vehicle}>{vehicle}</option>
              ))}
            </select>
            {errors.vehicleType && <p className="error-text">{errors.vehicleType}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="label">Phone number</label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              className="input"
              placeholder="98XXXXXXXX"
              value={form.phone}
              onChange={update('phone')}
            />
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>
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
        </div>

        {role !== 'rider' && (
          <div>
            <label htmlFor="address" className="label">
              {role === 'restaurant' ? 'Restaurant address' : 'Delivery address'}
            </label>
            <input
              id="address"
              type="text"
              autoComplete={role === 'customer' ? 'street-address' : 'off'}
              className="input"
              placeholder="Area, city"
              value={form.address}
              onChange={update('address')}
            />
            {errors.address && <p className="error-text">{errors.address}</p>}
          </div>
        )}

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="input"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={update('password')}
          />
          {errors.password && <p className="error-text">{errors.password}</p>}
        </div>

        <button type="submit" disabled={submitting || logoReading} className="btn-primary w-full">
          {submitting ? 'Creating account…' : copy.submit}
        </button>
      </form>
    </AuthLayout>
  );
}
