const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost/tripti-api').replace(/\/$/, '');
const TOKEN_KEY = 'tripti_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Could not reach the server. Make sure XAMPP Apache and MySQL are running.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) setToken(null);
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup.php', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login.php', { method: 'POST', body: payload }),
  me: () => request('/auth/me.php'),
  logout: () => request('/auth/logout.php', { method: 'POST' }),
  catalog: () => request('/catalog.php', { auth: false }),
  addFood: (payload) => request('/foods.php', { method: 'POST', body: payload }),
  updateFood: (payload) => request('/foods.php', { method: 'PATCH', body: payload }),
  deleteFood: (id) => request(`/foods.php?id=${id}`, { method: 'DELETE' }),
  setOpen: (isOpen) => request('/restaurant.php', { method: 'PATCH', body: { isOpen } }),
  orders: () => request('/orders.php'),
  placeOrder: (payload) => request('/orders.php', { method: 'POST', body: payload }),
  setOrderStatus: (code, status) => request('/orders.php', { method: 'PATCH', body: { code, status } }),
};

export const API_BASE_URL = BASE_URL;
