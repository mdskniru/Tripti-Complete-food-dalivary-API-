const STYLES = {
  Placed: 'bg-amber-50 text-amber-700',
  Accepted: 'bg-sky-50 text-sky-700',
  'Ready for Pickup': 'bg-violet-50 text-violet-700',
  'Picked Up': 'bg-indigo-50 text-indigo-700',
  'On the Way': 'bg-blue-50 text-blue-700',
  Delivered: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-600',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}
