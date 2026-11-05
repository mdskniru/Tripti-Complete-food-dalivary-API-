export const money = (value) =>
  `BDT ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value.replace ? value.replace(' ', 'T') : value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};
