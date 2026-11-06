import { useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import OrderItems from '../components/OrderItems';
import PageLoader from '../components/PageLoader';
import StatusBadge from '../components/StatusBadge';
import SmartImage from '../components/SmartImage';
import { useAuth } from '../context/AuthContext';
import { useFoods } from '../context/FoodsContext';
import { useOrders } from '../context/OrdersContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { CATEGORIES } from '../utils/constants';
import { formatDate, money } from '../utils/format';
import { readImageFile } from '../utils/image';

const BLANK_FORM = { name: '', description: '', price: '', category: CATEGORIES[0] };
const ORDER_FILTERS = ['Active', 'Completed', 'All'];
const ACTIVE_STATUSES = ['Placed', 'Accepted', 'Ready for Pickup', 'Picked Up', 'On the Way'];

export default function RestaurantDashboard() {
  const { currentUser, refreshUser } = useAuth();
  const { foods, loading: foodsLoading, load, addFood, updateFood, deleteFood } = useFoods();
  const { orders, loading: ordersLoading, error: ordersError, refresh, updateStatus } = useOrders();
  const { toast } = useToast();

  const [tab, setTab] = useState('orders');
  const [orderFilter, setOrderFilter] = useState('Active');
  const [openBusy, setOpenBusy] = useState(false);
  const [orderBusy, setOrderBusy] = useState('');
  const [menuBusy, setMenuBusy] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [image, setImage] = useState('');
  const [imageChanged, setImageChanged] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageReading, setImageReading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const myFoods = useMemo(() => {
    const restaurantIds = new Set(
      [currentUser?.id, currentUser?.userId, currentUser?.customId, currentUser?.code]
        .filter((id) => id !== null && id !== undefined && id !== '')
        .map(String)
    );
    return foods.filter((food) => restaurantIds.has(String(food.restaurantId ?? '')));
  }, [foods, currentUser]);

  const visibleOrders = useMemo(() => {
    if (orderFilter === 'Active') return orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
    if (orderFilter === 'Completed') return orders.filter((order) => ['Delivered', 'Rejected'].includes(order.status));
    return orders;
  }, [orders, orderFilter]);

  const pendingCount = orders.filter((order) => order.status === 'Placed').length;
  const preparingCount = orders.filter((order) => ['Accepted', 'Ready for Pickup'].includes(order.status)).length;
  const isOpen = Boolean(currentUser?.isOpen);

  const toggleOpen = async () => {
    setOpenBusy(true);
    try {
      await api.setOpen(!isOpen);
      await refreshUser();
      await load();
      toast(isOpen ? 'Your restaurant is now closed' : 'Your restaurant is now open');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setOpenBusy(false);
    }
  };

  const changeOrderStatus = async (code, status) => {
    setOrderBusy(`${code}:${status}`);
    try {
      await updateStatus(code, status);
      toast(`Order ${code} marked ${status.toLowerCase()}`);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setOrderBusy('');
    }
  };

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const resetForm = () => {
    setEditingId(null);
    setForm(BLANK_FORM);
    setImage('');
    setImageChanged(false);
    setImageError('');
    setFormErrors({});
    setFormError('');
  };

  const startEdit = (food) => {
    setEditingId(food.id);
    setForm({
      name: food.name,
      description: food.description,
      price: String(food.price),
      category: food.category,
    });
    setImage(food.image);
    setImageChanged(false);
    setImageError('');
    setFormErrors({});
    setFormError('');
    setTab('menu');
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError('');
    setImageReading(true);
    try {
      const data = await readImageFile(file);
      setImage(data);
      setImageChanged(true);
      setFormErrors((prev) => ({ ...prev, image: undefined }));
    } catch (error) {
      setImageError(error.message);
    } finally {
      setImageReading(false);
    }
  };

  const handleSaveFood = async (event) => {
    event.preventDefault();

    const found = {};
    if (!form.name.trim()) found.name = 'Enter a food name';
    if (!form.description.trim()) found.description = 'Enter a short description';
    if (!form.price || Number(form.price) <= 0) found.price = 'Enter a valid price';
    if (!form.category) found.category = 'Choose a category';
    if (!editingId && !image) found.image = 'Upload a JPG, PNG or WEBP photo under 2 MB';
    setFormErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      category: form.category,
    };
    if (!editingId || imageChanged) payload.image = image;

    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        await updateFood(editingId, payload);
        toast('Menu item updated');
      } else {
        await addFood(payload);
        toast('New item added to your menu');
      }
      resetForm();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async (food) => {
    setMenuBusy(food.id);
    try {
      await updateFood(food.id, { available: !food.available });
      toast(`${food.name} is now ${food.available ? 'unavailable' : 'available'}`);
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setMenuBusy(null);
    }
  };

  const handleDelete = async (food) => {
    if (!window.confirm(`Delete “${food.name}” from your menu?`)) return;
    setMenuBusy(food.id);
    try {
      await deleteFood(food.id);
      if (editingId === food.id) resetForm();
      toast('Menu item deleted');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setMenuBusy(null);
    }
  };

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {currentUser?.logo ? (
            <SmartImage src={currentUser.logo} alt={currentUser.restaurantName} className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-100 text-xl font-black text-brand-700">
              {(currentUser?.restaurantName || 'R').charAt(0)}
            </span>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Restaurant dashboard</p>
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {currentUser?.restaurantName}
            </h1>
            <p className="text-xs text-slate-500">Owner: {currentUser?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">Accepting orders</p>
            <p className={`text-sm font-bold ${isOpen ? 'text-emerald-600' : 'text-red-600'}`}>
              {isOpen ? 'Open now' : 'Closed'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isOpen}
            aria-label="Toggle restaurant open status"
            onClick={toggleOpen}
            disabled={openBusy}
            className={`relative h-7 w-12 rounded-full transition disabled:opacity-60 ${
              isOpen ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                isOpen ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">New orders</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{pendingCount}</p>
          <p className="text-xs text-slate-500">Waiting for your response</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Preparing</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{preparingCount}</p>
          <p className="text-xs text-slate-500">Accepted or ready for pickup</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Menu items</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{myFoods.length}</p>
          <p className="text-xs text-slate-500">{myFoods.filter((food) => food.available).length} available</p>
        </div>
      </div>

      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'orders' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Orders {pendingCount > 0 && <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">{pendingCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => setTab('menu')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            tab === 'menu' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Menu ({myFoods.length})
        </button>
      </div>

      {tab === 'orders' ? (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {ORDER_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setOrderFilter(filter)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                    orderFilter === filter
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button type="button" onClick={refresh} disabled={ordersLoading} className="text-sm font-semibold text-brand-700 hover:underline">
              {ordersLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {ordersError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {ordersError}
            </div>
          )}

          {ordersLoading && !orders.length ? (
            <PageLoader label="Loading orders…" />
          ) : visibleOrders.length === 0 ? (
            <EmptyState
              title={orders.length ? 'No orders in this view' : 'No orders yet'}
              description={
                orders.length
                  ? 'Switch the filter to see other orders.'
                  : 'When a customer places an order it will appear here instantly.'
              }
            />
          ) : (
            <div className="space-y-4">
              {visibleOrders.map((order) => (
                <article key={order.code} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-black tracking-wide text-slate-900">{order.code}</h2>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">Placed {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total (COD)</p>
                      <p className="text-lg font-black text-slate-900">{money(order.total)}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-4 border-t border-slate-100 pt-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Customer</p>
                      <p className="mt-1 font-semibold text-slate-800">{order.customerName}</p>
                      <a href={`tel:${order.phone}`} className="text-sm font-medium text-brand-700 hover:underline">
                        {order.phone}
                      </a>
                      <p className="text-sm text-slate-500">{order.address}</p>
                      {order.note && (
                        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                          Note: {order.note}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Items</p>
                      <div className="mt-1">
                        <OrderItems items={order.items} />
                      </div>
                    </div>
                  </div>

                  {(order.status === 'Placed' || order.status === 'Accepted') && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      {order.status === 'Placed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => changeOrderStatus(order.code, 'Accepted')}
                            disabled={orderBusy === `${order.code}:Accepted`}
                            className="btn-primary"
                          >
                            {orderBusy === `${order.code}:Accepted` ? 'Accepting…' : 'Accept order'}
                          </button>
                          <button
                            type="button"
                            onClick={() => changeOrderStatus(order.code, 'Rejected')}
                            disabled={orderBusy === `${order.code}:Rejected`}
                            className="btn-outline border-red-200 text-red-600 hover:border-red-300 hover:text-red-700"
                          >
                            {orderBusy === `${order.code}:Rejected` ? 'Rejecting…' : 'Reject'}
                          </button>
                        </>
                      )}
                      {order.status === 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => changeOrderStatus(order.code, 'Ready for Pickup')}
                          disabled={orderBusy === `${order.code}:Ready for Pickup`}
                          className="btn-primary"
                        >
                          {orderBusy === `${order.code}:Ready for Pickup` ? 'Updating…' : 'Mark ready for pickup'}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <form onSubmit={handleSaveFood} noValidate className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit menu item' : 'Add a new food item'}
              </h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
                  Cancel edit
                </button>
              )}
            </div>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            )}

            <div className="mt-4 grid gap-5 md:grid-cols-[220px_1fr]">
              <div>
                <label htmlFor="food-image" className="label">Food photo</label>
                <div className="overflow-hidden rounded-xl border border-dashed border-slate-300">
                  {image ? (
                    <img src={image} alt="Food preview" className="h-36 w-full object-cover" />
                  ) : (
                    <div className="grid h-36 place-items-center bg-slate-50 text-xs text-slate-400">
                      No photo selected
                    </div>
                  )}
                </div>
                <input
                  id="food-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImage}
                  className="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700"
                />
                <p className="mt-1 text-[11px] text-slate-400">Uploaded from your device · JPG, PNG or WEBP · max 2 MB</p>
                {imageReading && <p className="text-[11px] text-slate-400">Reading image…</p>}
                {imageError && <p className="error-text">{imageError}</p>}
                {formErrors.image && <p className="error-text">{formErrors.image}</p>}
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="food-name" className="label">Food name</label>
                  <input id="food-name" className="input" value={form.name} onChange={update('name')} placeholder="e.g. Chicken Biryani" />
                  {formErrors.name && <p className="error-text">{formErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="food-description" className="label">Description</label>
                  <textarea
                    id="food-description"
                    rows="2"
                    className="input resize-none"
                    value={form.description}
                    onChange={update('description')}
                    placeholder="What makes this dish special?"
                  />
                  {formErrors.description && <p className="error-text">{formErrors.description}</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="food-price" className="label">Price (BDT)</label>
                    <input
                      id="food-price"
                      type="number"
                      min="1"
                      step="1"
                      className="input"
                      value={form.price}
                      onChange={update('price')}
                      placeholder="320"
                    />
                    {formErrors.price && <p className="error-text">{formErrors.price}</p>}
                  </div>
                  <div>
                    <label htmlFor="food-category" className="label">Category</label>
                    <select id="food-category" className="input" value={form.category} onChange={update('category')}>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {formErrors.category && <p className="error-text">{formErrors.category}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" disabled={saving || imageReading} className="btn-primary">
                {saving ? 'Saving…' : editingId ? 'Update item' : 'Add to menu'}
              </button>
              <button type="button" onClick={resetForm} className="btn-outline">Clear form</button>
            </div>
          </form>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Your menu</h2>
              <button type="button" onClick={load} className="text-sm font-semibold text-brand-700 hover:underline">
                Refresh
              </button>
            </div>

            {foodsLoading && !myFoods.length ? (
              <PageLoader label="Loading your menu…" />
            ) : myFoods.length === 0 ? (
              <EmptyState
                title="Your menu is empty"
                description="Add your first dish using the form above. Customers will see it right away."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myFoods.map((food) => (
                  <article key={food.id} className="card flex gap-3 p-3">
                    <SmartImage src={food.image} alt={food.name} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900">{food.name}</h3>
                          <p className="text-xs text-slate-500">{food.category} · {money(food.price)}</p>
                        </div>
                        <span
                          className={`badge shrink-0 ${
                            food.available ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {food.available ? 'Available' : 'Hidden'}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">{food.description}</p>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                        <button
                          type="button"
                          onClick={() => toggleAvailability(food)}
                          disabled={menuBusy === food.id}
                          className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                        >
                          {food.available ? 'Mark unavailable' : 'Mark available'}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(food)}
                          className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(food)}
                          disabled={menuBusy === food.id}
                          className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
