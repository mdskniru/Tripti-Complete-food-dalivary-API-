import { useMemo, useState } from 'react';
import FoodCard from '../components/FoodCard';
import EmptyState from '../components/EmptyState';
import SmartImage from '../components/SmartImage';
import { useFoods } from '../context/FoodsContext';
import { CATEGORIES } from '../utils/constants';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-400">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" strokeLinecap="round" />
    </svg>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="skeleton h-40 rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { foods, restaurants, loading, error } = useFoods();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesCategory = category === 'All' || food.category === category;
      const haystack = `${food.name} ${food.restaurantName} ${food.category} ${food.description}`.toLowerCase();
      return matchesCategory && (!search || haystack.includes(search));
    });
  }, [foods, query, category]);

  return (
    <>
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(249,115,22,0.4),transparent_55%),radial-gradient(circle_at_85%_0%,rgba(251,146,60,0.18),transparent_45%)]" />
        <div className="container-page relative py-12 sm:py-16 lg:py-20">
          <span className="badge bg-white/10 text-brand-200">Fresh · Local · Delivered</span>
          <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Your favourite meals,
            <br />
            <span className="text-brand-400">delivered to your door.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Order from the best kitchens in town. Cash on delivery, live order tracking and no hidden fees.
          </p>

          <div className="mt-7 max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-soft">
              <span className="pl-2">
                <SearchIcon />
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search dishes or restaurants"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                aria-label="Search dishes or restaurants"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-400 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
            <span>{restaurants.length} restaurants</span>
            <span>{foods.length} dishes on the menu</span>
            <span>Cash on Delivery</span>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        {restaurants.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Nearby kitchens</p>
                <h2 className="section-title">Restaurants on Tripti</h2>
              </div>
              <p className="muted">Closed restaurants cannot take orders</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="card flex items-center gap-3 p-3.5">
                  {restaurant.logo ? (
                    <SmartImage
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-lg font-black text-brand-700">
                      {restaurant.name.charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800">{restaurant.name}</p>
                    <p className="truncate text-xs text-slate-500">{restaurant.address}</p>
                  </div>
                  <span
                    className={`badge shrink-0 ${
                      restaurant.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Explore the menu</p>
              <h2 className="section-title">What are you craving?</h2>
            </div>
            <p className="muted">{filtered.length} dishes</p>
          </div>

          <div className="-mx-4 mb-5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2">
              {['All', ...CATEGORIES].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    category === item
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="card mb-6 border-red-200 bg-red-50 p-5 text-sm text-red-700">
              <p className="font-bold">Could not load the menu</p>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-red-600">
                Start Apache and MySQL in XAMPP, then visit{' '}
                <a href="http://localhost/tripti-api/setup.php" className="font-semibold underline">
                  http://localhost/tripti-api/setup.php
                </a>{' '}
                once to create the database.
              </p>
            </div>
          )}

          {loading ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No dishes found"
              description="Try a different search term or category."
              action={
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => {
                    setQuery('');
                    setCategory('All');
                  }}
                >
                  Reset filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            ['1', 'Pick your meal', 'Browse dishes from local restaurants and add them to your cart.'],
            ['2', 'Checkout with COD', 'Confirm your delivery details and pay cash when the food arrives.'],
            ['3', 'Track every step', 'Follow your order from the kitchen to your door in real time.'],
          ].map(([step, title, description]) => (
            <div key={step} className="card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-black text-brand-700">
                {step}
              </span>
              <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
