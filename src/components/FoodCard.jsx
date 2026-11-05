import SmartImage from './SmartImage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { money } from '../utils/format';

export default function FoodCard({ food }) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const disabled = !food.isOpen || !food.available;
  const label = !food.isOpen ? 'Closed' : !food.available ? 'Unavailable' : 'Add';

  const handleAdd = () => {
    const result = addItem(food.id);
    if (result.ok) toast(`${food.name} added to cart`);
    else toast(result.error, 'error');
  };

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative h-40 overflow-hidden sm:h-44">
        <SmartImage
          src={food.image}
          alt={food.name}
          className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
            disabled ? 'grayscale' : ''
          }`}
        />
        <span className="badge absolute left-2 top-2 bg-white/95 text-slate-700">{food.category}</span>
        <span
          className={`badge absolute right-2 top-2 ${
            food.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {food.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div>
          <h3 className="font-bold text-slate-900">{food.name}</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{food.restaurantName}</p>
        </div>
        <p className="line-clamp-2 text-sm text-slate-500">{food.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="text-lg font-extrabold text-slate-900">{money(food.price)}</span>
          <button type="button" onClick={handleAdd} disabled={disabled} className="btn-primary px-3.5 py-2">
            {label}
          </button>
        </div>
      </div>
    </article>
  );
}
