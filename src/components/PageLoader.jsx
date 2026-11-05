export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
