# Tripti — Food Delivery App

A complete three-role food delivery application built with **React + Vite + Tailwind CSS** and a
real **PHP 8 + MySQL** backend designed to run under **XAMPP**.

Customers can browse and order food with Cash on Delivery, restaurants manage their menu and orders,
and riders pick up and deliver orders — all backed by a MySQL database instead of browser storage.

## Features

### Customer
- Browse restaurants and dishes without logging in
- Search by dish / restaurant and filter by category
- Closed restaurants and unavailable dishes cannot be added to the cart
- Persistent cart (localStorage) with quantity controls and a one-restaurant limit
- Customer signup / login
- Checkout with name, phone, address and an optional note
- Cash on Delivery only
- Order confirmation with order code
- “My Orders” page with a six-step status tracker

### Restaurant owner
- Separate restaurant signup/login
- Dashboard with an open/closed switch that instantly affects the public menu
- Add food with a device-uploaded photo (JPG/PNG/WEBP, max 2 MB, stored as base64 in MySQL)
- Edit / delete menu items and toggle availability
- Incoming orders with customer details, items and COD total
- Accept, reject, and mark orders ready for pickup

### Rider
- Separate rider signup/login with vehicle type
- See orders that restaurants marked “Ready for Pickup”
- Pick up an order (atomically assigned to that rider, removed for others)
- Update status: Picked Up → On the Way → Delivered
- View delivery history

### Order statuses
`Placed → Accepted → Ready for Pickup → Picked Up → On the Way → Delivered`
(or `Rejected` by the restaurant)

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Context API |
| Backend | PHP 8 (PDO), MySQL / MariaDB via XAMPP |
| Auth | Bearer tokens stored hashed in `api_tokens`, `password_hash()` |
| Data | MySQL database `tripti` |

## Project structure

```
.
├── backend/                 # PHP API — copy this into C:\xampp\htdocs\tripti-api
│   ├── auth/                # signup, login, me, logout
│   ├── config.php           # DB connection, CORS, auth helpers
│   ├── setup.php            # creates the database, tables and demo data
│   ├── database.sql         # reference schema
│   ├── catalog.php          # public restaurants + foods
│   ├── foods.php            # restaurant menu CRUD
│   ├── restaurant.php       # open/closed toggle
│   └── orders.php           # place / list / update orders
├── src/
│   ├── components/          # Navbar, FoodCard, guards, shared UI
│   ├── context/             # Auth, Foods, Cart, Orders, Toast
│   ├── pages/               # all route pages
│   └── utils/               # api client, validation, formatting
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Setup with XAMPP

### 1. Start XAMPP
Open the XAMPP Control Panel and start **Apache** and **MySQL**.

### 2. Put the API in `htdocs`
Copy the `backend` folder to:

```
C:\xampp\htdocs\tripti-api
```

The folder must be named `tripti-api` so the default frontend API URL works. You can also use a
junction instead of copying:

```bat
mklink /J "C:\xampp\htdocs\tripti-api" "C:\path\to\this\project\backend"
```

### 3. Create the database
Open this URL once in your browser:

```
http://localhost/tripti-api/setup.php
```

You should see JSON like `{"ok":true,"message":"Tripti database is ready."}`.
This creates the `tripti` database, all tables and the demo accounts/dishes. It is safe to run again —
it only seeds when the `users` table is empty.

If MySQL uses a password, edit `backend/config.php`:

```php
const DB_USER = 'root';
const DB_PASS = 'your_password';
```

### 4. Run the frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The API URL defaults to `http://localhost/tripti-api`. To override it, create `.env`:

```
VITE_API_URL=http://localhost/tripti-api
```

## Demo accounts

All demo passwords are `123456`.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `demo@tripti.com` | `123456` |
| Restaurant (Spice Garden) | `owner@tripti.com` | `123456` |
| Restaurant (Burger Hub) | `owner2@tripti.com` | `123456` |
| Restaurant (Pizza Roma) | `owner3@tripti.com` | `123456` |
| Restaurant (closed demo) | `owner4@tripti.com` | `123456` |
| Rider | `rider@tripti.com` | `123456` |

The seed data also includes 12 dishes and one sample order (`TRP-100001`) for the demo customer.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home + menu (public) |
| `/login`, `/signup` | Customer auth |
| `/cart` | Cart |
| `/checkout` | Checkout (customer only) |
| `/order-success/:code` | Confirmation |
| `/my-orders` | Customer order history + tracking |
| `/restaurant/login`, `/restaurant/signup` | Restaurant auth |
| `/restaurant/dashboard` | Restaurant orders + menu |
| `/rider/login`, `/rider/signup` | Rider auth |
| `/rider/dashboard` | Pickups, active deliveries, history |

## API overview

All responses are JSON. Protected endpoints need `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/signup.php` | Public | Create customer / restaurant / rider |
| POST | `/auth/login.php` | Public | Sign in and receive a token |
| GET | `/auth/me.php` | Any signed-in user | Current user |
| POST | `/auth/logout.php` | Any signed-in user | Revoke token |
| GET | `/catalog.php` | Public | Restaurants and foods |
| POST | `/foods.php` | Restaurant | Add food |
| PATCH | `/foods.php` | Restaurant | Edit / toggle availability |
| DELETE | `/foods.php?id=` | Restaurant | Delete food |
| PATCH | `/restaurant.php` | Restaurant | Set open/closed |
| GET | `/orders.php` | Signed-in | Role-filtered orders |
| POST | `/orders.php` | Customer | Place an order (server calculates totals) |
| PATCH | `/orders.php` | Restaurant / rider | Transition order status |

Server-side rules enforced by the API:
- Prices, delivery fee (BDT 50) and totals are computed from the database, never trusted from the client.
- Orders cannot mix restaurants, and cannot be placed from a closed restaurant or with unavailable dishes.
- A rider can only pick up an unassigned `Ready for Pickup` order; the claim is atomic.
- Restaurants can only transition their own orders; riders can only change delivery status on orders assigned to them.

## Notes

- Images added via the restaurant dashboard are read with `FileReader`, validated (JPG/PNG/WEBP, 2 MB)
  and stored as base64 in MySQL (`LONGTEXT`).
- The cart lives in `localStorage`; users, foods, orders and sessions live in MySQL.
- For a production build run `npm run build`. Because the app uses `BrowserRouter`, configure Apache
  (or another host) to fall back to `index.html` for client-side routes.
- This is a college-project implementation: tokens use a simple 30-day expiry, and there is no email
  verification, password reset or online payment.
