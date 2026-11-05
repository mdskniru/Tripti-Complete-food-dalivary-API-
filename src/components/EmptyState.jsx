export default function EmptyState({ title, description, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
          <path d="M7 3v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M9 11v10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 3c-1.2 1.6-1.7 3.3-1.7 5.2 0 1.1.5 2 1.3 2.5l.4.3V21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
