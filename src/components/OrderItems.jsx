import { money } from '../utils/format';

export default function OrderItems({ items }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item, index) => (
        <li key={`${item.foodId ?? item.name}-${index}`} className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-slate-600">
            <span className="font-semibold text-slate-800">{item.qty}×</span> {item.name}
          </span>
          <span className="font-medium text-slate-700">{money(item.price * item.qty)}</span>
        </li>
      ))}
    </ul>
  );
}
