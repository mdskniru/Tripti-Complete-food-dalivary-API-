import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft lg:grid-cols-[1.05fr_1fr]">
        <div className="relative hidden flex-col justify-between gap-10 bg-slate-900 p-10 text-white lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(249,115,22,0.35),transparent_55%)]" />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-lg font-black">T</span>
              <span className="text-2xl font-black tracking-tight">Tripti</span>
            </Link>
            <h2 className="mt-10 max-w-sm text-3xl font-black leading-tight">
              Good food, delivered with a smile.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
              One app, three experiences — order your favourite meals, run your restaurant, or deliver
              across the city.
            </p>
          </div>
          <ul className="relative space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Live order status at every step
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Cash on delivery, no card needed
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> Separate dashboards for partners
            </li>
          </ul>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer && <div className="mt-6 text-sm text-slate-500">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
