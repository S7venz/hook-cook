# Hook & Cook — API documentation

REST API of the Grails backend, consumed by the React frontend and by the
admin dashboard.

---

## Table of contents

- [General](#general)
- [Authentication](#1-authentication)
- [Products](#2-products)
- [Reference data](#3-reference-data)
- [Orders](#4-orders)
- [Fishing permits](#5-fishing-permits)
- [Contests and registrations](#6-contests-and-registrations)
- [Catch log](#7-catch-log)
- [File uploads](#8-file-uploads)
- [Admin statistics](#9-admin-statistics)
- [Product reviews](#10-product-reviews)
- [Wishlist (favorites)](#11-wishlist-favorites)
- [Back-in-stock alerts](#12-back-in-stock-alerts)
- [Monthly leaderboard](#13-monthly-leaderboard)
- [Admin CSV exports](#14-admin-csv-exports)
- [GDPR (export and deletion)](#15-gdpr)
- [Password reset](#16-password-reset)
- [Stripe payments](#17-stripe-payments)
- [Data model](#data-model)
- [HTTP status codes](#http-status-codes)

---

## General

### Base URL

| Environment | URL |
|---|---|
| Local development | `http://localhost:8080` |
| Docker Compose | `http://localhost:8080` |

Every endpoint is prefixed by `/api/`.

### Formats

- **Requests**: `Content-Type: application/json` (except multipart uploads — see §8)
- **Responses**: `application/json` everywhere
- **Encoding**: UTF-8
- **Dates**: ISO 8601 (`2026-04-21T10:15:00Z`) for timestamps, `YYYY-MM-DD` for plain dates

### Authentication

The API uses a **JWT (HS512)** sent in the HTTP header:

```
Authorization: Bearer <token>
```

The token is issued by `POST /api/auth/login` or `POST /api/auth/register`. It contains:
- `sub`: user identifier (Long)
- `role`: `ROLE_USER` or `ROLE_ADMIN`
- `exp`: expiration (7 days by default)

Passwords are hashed server-side with **BCrypt** (cost factor 12).

### Roles

| Role | Description |
|---|---|
| `ROLE_USER` | Registered customer — access to their own data (orders, permits, catch log) |
| `ROLE_ADMIN` | Administrator — access to all data + management actions |

### Error format

All errors return a JSON body of the form:

```json
{ "error": "Human-readable message in French" }
```

---

## 1. Authentication

### 1.1 — Sign up

```
POST /api/auth/register
```

**Public.** Creates a `ROLE_USER` account and returns a JWT token.

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "secretpwd123",
  "firstName": "Alice",
  "lastName": "Martin"
}
```

**Response `201`:**
```json
{
  "user": {
    "id": 42,
    "email": "alice@example.com",
    "firstName": "Alice",
    "lastName": "Martin",
    "role": "ROLE_USER",
    "phone": null,
    "addressLine": null,
    "postalCode": null,
    "city": null,
    "country": null
  },
  "token": "eyJhbGciOiJIUzUxMiJ9..."
}
```

**Errors:**
- `400` — missing fields, invalid email, password < 8 chars, email already taken

---

### 1.2 — Sign in

```
POST /api/auth/login
```

**Public.** Validates credentials and returns a JWT token.

**Request:**
```json
{ "email": "alice@example.com", "password": "secretpwd123" }
```

**Response `200`:** identical to `register`.

**Errors:**
- `401` — wrong email or password

---

### 1.3 — Current profile

```
GET /api/auth/me
```

**Authenticated.** Returns the account info bound to the token.

**Response `200`:**
```json
{ "user": { "id": 42, "email": "...", ... } }
```

**Errors:**
- `401` — missing or invalid token

---

### 1.4 — Update profile

```
PATCH /api/auth/me
```

**Authenticated.** Partial update of the editable fields.

**Request (all fields optional):**
```json
{
  "firstName": "Alice",
  "lastName": "Martin",
  "phone": "06 12 34 56 78",
  "addressLine": "12 rue de la Têt",
  "postalCode": "66000",
  "city": "Perpignan",
  "country": "France"
}
```

**Response `200`:** `{ "user": { ... } }`

---

## 2. Products

### 2.1 — Product list

```
GET /api/products
```

**Public.** Returns all products sorted by name.

**Response `200`:**
```json
[
  {
    "id": "hc-sauvage-9-5",
    "sku": "HC-C-095-6#4",
    "name": "Hook & Cook Sauvage 9'5\" #6 rod",
    "category": "cannes",
    "technique": "mouche",
    "price": 489.0,
    "wasPrice": null,
    "stock": 12,
    "rating": 4.8,
    "reviews": 34,
    "brand": "Hook & Cook",
    "water": "river",
    "img": null,
    "imageUrl": "http://localhost:8080/api/uploads/canne-95.jpg",
    "description": "High-modulus carbon blank...",
    "lowStockThreshold": 15,
    "story": "Assembled in Prades...",
    "species": ["truite", "ombre"],
    "months": [3, 4, 5, 6, 7, 8, 9],
    "variants": { "length": ["9'", "9'5\"", "10'"] },
    "specs": { "weight": "98 g", "sections": 4 }
  }
]
```

### 2.2 — Product detail

```
GET /api/products/{id}
```

**Public.** `{id}` = product slug (e.g. `hc-sauvage-9-5`).

**Errors:** `404` — product not found.

### 2.3 — Create a product

```
POST /api/products
```

**Admin.** Required fields: `id`, `sku`, `name`, `category`.

**Request:** same structure as the §2.1 response.

**Response `201`:** the created product (`toApiMap`).

**Errors:**
- `400` — missing required fields or validation failure
- `409` — a product already exists with that `id`
- `403` — user is not admin

### 2.4 — Update a product

```
PUT /api/products/{id}
```

**Admin.** All fields optional (partial update). `id` cannot be changed.

### 2.5 — Delete a product

```
DELETE /api/products/{id}
```

**Admin.** Response `204 No Content`.

### 2.6 — Replenish stock

```
POST /api/products/{id}/replenish
```

**Admin.** Adds `qty` to the current stock.

**Request:**
```json
{ "qty": 10 }
```

**Errors:**
- `400` — `qty` ≤ 0

---

## 3. Reference data

Categories, techniques, species and contests — used to feed the shop filters
and the UI.

### 3.1 — Categories

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List sorted by name |
| `POST` | `/api/categories` | Admin | Create. Body: `{ id, name, count }` |
| `PUT` | `/api/categories/{id}` | Admin | Update |
| `DELETE` | `/api/categories/{id}` | Admin | Delete |

**Shape:** `{ id, name, count }` — `count` = indicative number displayed in the filter.

### 3.2 — Techniques

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/techniques` | Public |
| `POST` | `/api/techniques` | Admin |
| `PUT` | `/api/techniques/{id}` | Admin |
| `DELETE` | `/api/techniques/{id}` | Admin |

**Shape:** `{ id, name }`

### 3.3 — Species

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/species` | Public |
| `POST` | `/api/species` | Admin |
| `PUT` | `/api/species/{id}` | Admin |
| `DELETE` | `/api/species/{id}` | Admin |

**Shape:**
```json
{
  "id": "truite",
  "name": "Brown trout",
  "latin": "Salmo trutta fario",
  "water": "river",
  "imageUrl": "http://localhost:8080/api/uploads/species-truite.webp",
  "months": [3, 4, 5, 6, 7, 8, 9]
}
```

### 3.4 — Contests

| Method | Endpoint | Role |
|---|---|---|
| `GET` | `/api/contests` | Public — list sorted by date |
| `GET` | `/api/contests/{id}` | Public — detail |
| `POST` | `/api/contests` | Admin |
| `PUT` | `/api/contests/{id}` | Admin |
| `DELETE` | `/api/contests/{id}` | Admin — also drops linked registrations |

**Shape:**
```json
{
  "id": "vesoul-2026-05",
  "title": "Têt Open — Brown trout",
  "date": "2026-05-04",
  "dateDisplay": "MAY 04",
  "lieu": "Têt valley — Olette (66)",
  "distance": "38 km",
  "format": "No-kill · individual",
  "prix": 25.0,
  "inscrits": 18,
  "max": 40,
  "reglement": "Fly fishing only...",
  "species": ["truite"]
}
```

> ⚠️ Required on creation: `id`, `title`, `date`, `dateDisplay`, `lieu`.

### 3.5 — Permit types

```
GET /api/permit-types
```

**Public.** Returns the permit pricing grid (persisted in DB, table `permit_types`).

**Response `200`:**
```json
[
  {
    "id": "decouverte",
    "title": "Trial permit",
    "label": "Under 12",
    "price": 6.00,
    "items": ["Minors up to 12", "All year", "Free under 2"]
  },
  {
    "id": "semaine",
    "title": "Weekly permit",
    "label": "Holiday",
    "price": 28.00,
    "items": ["7 consecutive days", "Inter-federation card", "Great for trips"]
  },
  {
    "id": "annuel",
    "title": "Yearly permit",
    "label": "Most popular",
    "price": 92.00,
    "items": ["Valid 1 Jan to 31 Dec", "All 1st and 2nd category waters", "CPMA included"]
  }
]
```

### 3.6 — Departments

```
GET /api/departments
```

**Public.** Returns the *départements* eligible for a permit application
(table `departments`).

**Response `200`:**
```json
[
  { "code": "09", "name": "09 — Ariège" },
  { "code": "11", "name": "11 — Aude" },
  { "code": "34", "name": "34 — Hérault" },
  { "code": "66", "name": "66 — Pyrénées-Orientales" }
]
```

---

## 4. Orders

### 4.1 — My orders

```
GET /api/orders/me
```

**Authenticated.** Returns the current user's orders, sorted by descending date.

**Response `200`:**
```json
[
  {
    "id": "HC-2186-4829",
    "date": "2026-04-15T09:12:00Z",
    "email": "alice@example.com",
    "subtotal": 489.0,
    "shipping": 5.9,
    "total": 494.9,
    "status": "paid",
    "statusLabel": "Paid",
    "shippingMode": "Standard Colissimo",
    "address": { "line": "12 rue de la Têt", "postal": "66000", "city": "Perpignan" },
    "items": [
      {
        "productId": "hc-sauvage-9-5",
        "productName": "Hook & Cook Sauvage 9'5\" #6 rod",
        "productSku": "HC-C-095-6#4",
        "productBrand": "Hook & Cook",
        "productImageUrl": "...",
        "unitPrice": 489.0,
        "qty": 1
      }
    ]
  }
]
```

### 4.2 — Create an order

```
POST /api/orders
```

**Authenticated.** Creates an order from the client-side cart. Server-side
stock check, total recomputed from the DB price (never trust the client
amount), then:

- **Stripe mode** (`STRIPE_SECRET_KEY` set): create a Stripe PaymentIntent,
  initial status `pending`. The transition to `paid` + stock decrement +
  confirmation email happens inside the `payment_intent.succeeded` webhook
  (see §17).
- **Mock mode** (CI / demo without a key): status directly `paid`, stock
  decremented, email sent.

**Request:** only `id` and `qty` of each product are needed (the backend
hydrates the rest from the DB).
```json
{
  "email": "alice@example.com",
  "address": { "line": "12 rue de la Têt", "postal": "66000", "city": "Perpignan" },
  "shippingMode": "Standard Colissimo",
  "shipping": 5.9,
  "items": [
    { "qty": 1, "product": { "id": "hc-sauvage-9-5" } }
  ]
}
```

**Response `201` (Stripe mode):**
```json
{
  "order": {
    "id": "HC-2186-4829",
    "status": "pending",
    "statusLabel": "Awaiting payment",
    "stripePaymentIntentId": "pi_3OXxXxxxxxxxxxxx",
    "total": 494.9,
    "items": [/* … */]
  },
  "clientSecret": "pi_3OXxXxxxxxxxxxxx_secret_xxxxxxxx",
  "publishableKey": "pk_test_xxxxxxxxxxxx"
}
```

**Response `201` (mock mode):**
```json
{
  "order": { "id": "HC-2186-4829", "status": "paid", /* … */ },
  "mockPayment": true
}
```

**Errors:**
- `400` — empty cart, product not found, insufficient stock, or Stripe init failure

### 4.3 — Order detail

```
GET /api/orders/{reference}
```

**Authenticated.** A user can only see their own orders; admins see every order.

**Errors:**
- `403` — someone else's order
- `404` — order not found

### 4.4 — All orders list (admin)

```
GET /api/orders
```

**Admin.** Full list, sorted by descending date.

### 4.5 — Change status

```
PATCH /api/orders/{reference}
```

**Admin.**

**Request:**
```json
{ "status": "shipped" }
```

**Allowed values:** `paid`, `shipped`, `delivered`, `cancelled`.

> ⚠️ Statuses `pending` and `payment_failed` are handled exclusively by the
> Stripe webhook — rejected here.

---

## 5. Fishing permits

### 5.1 — My current permit

```
GET /api/permits/me
```

**Authenticated.** Returns the user's most recent permit, or
`{ "permit": null }` if they have none.

### 5.2 — Submit a request

```
POST /api/permits
```

**Authenticated.**

**Request:**
```json
{
  "typeId": "annuel",
  "firstName": "Alice",
  "lastName": "Martin",
  "birthDate": "1990-05-12",
  "department": "66 — Pyrénées-Orientales",
  "idDocUrl": "http://localhost:8080/api/uploads/1745234567890-a1b2c3d4.jpg",
  "photoDocUrl": "http://localhost:8080/api/uploads/1745234598123-ef567890.jpg"
}
```

- `typeId` must match an `id` returned by [§3.5](#35-permit-types).
- `department` accepts either the code (`"66"`) or the full name (`"66 — Pyrénées-Orientales"`).
- `idDocUrl` and `photoDocUrl` are obtained beforehand via [§8](#8-file-uploads).

**Response `201`:**
```json
{
  "id": "FR-2026-48291",
  "typeId": "annuel",
  "typeTitle": "Yearly permit",
  "amount": 92.0,
  "department": "66 — Pyrénées-Orientales",
  "firstName": "Alice",
  "lastName": "Martin",
  "birthDate": "1990-05-12",
  "status": "pending",
  "statusLabel": "Under review",
  "submittedAt": "2026-04-21T10:15:00Z",
  "idDocUrl": "http://localhost:8080/api/uploads/1745234567890-a1b2c3d4.jpg",
  "photoDocUrl": "http://localhost:8080/api/uploads/1745234598123-ef567890.jpg",
  "history": [
    { "label": "Request sent", "date": "21/04/2026 12:15", "done": true },
    { "label": "Payment confirmed", "date": "21/04/2026 12:18", "done": true },
    { "label": "Under review (federation)", "date": "21/04/2026 13:15", "done": true, "current": true },
    { "label": "Decision", "date": null, "done": false }
  ]
}
```

### 5.3 — All permits list (admin)

```
GET /api/permits
```

**Admin.** Each row includes a `userEmail` for the dashboard display.

### 5.4 — Approve or reject

```
PATCH /api/permits/{reference}
```

**Admin.** Sends the decision email to the requester (`MailService.permitDecision`).

**Request:**
```json
{ "status": "approved" }
```

**Allowed values:** `approved`, `rejected`.

---

## 6. Contests and registrations

### 6.1 — Register for a contest

```
POST /api/contests/{id}/register
```

**Authenticated.** Increments `contest.inscrits` and sends a confirmation email.

**Request:**
```json
{
  "category": "hommes-am",
  "permitNumber": "FR-2026-48291"
}
```

**Allowed categories:** `hommes-exp`, `hommes-am`, `femmes`, `jeunes`
(men-pro, men-amateur, women, junior).

**Response `201`:**
```json
{
  "id": 17,
  "contestId": "vesoul-2026-05",
  "contestTitle": "Têt Open — Brown trout",
  "contestDate": "MAY 04",
  "category": "hommes-am",
  "permitNumber": "FR-2026-48291",
  "submittedAt": "2026-04-21T10:30:00Z"
}
```

**Errors:**
- `400` — contest not found or user already registered

### 6.2 — My registrations

```
GET /api/contests-registrations/me
```

**Authenticated.**

### 6.3 — All registrations (admin)

```
GET /api/contests-registrations
```

**Admin.** Each row includes `userEmail`.

---

## 7. Catch log

Bonus feature letting the angler log their catches.

### 7.1 — List my catches

```
GET /api/carnet
```

**Authenticated.**

**Response `200`:**
```json
[
  {
    "id": "8",
    "date": "2026-04-18",
    "species": "truite",
    "taille": 34,
    "poids": 420,
    "spot": "La Têt — Olette",
    "bait": "Sedge olive #14",
    "weather": "Overcast, 12 °C",
    "photo": "IMG_4281"
  }
]
```

### 7.2 — Save a catch

```
POST /api/carnet
```

**Authenticated.**

**Request:**
```json
{
  "date": "2026-04-18",
  "species": "truite",
  "taille": 34,
  "poids": 420,
  "spot": "La Têt — Olette",
  "bait": "Sedge olive #14",
  "weather": "Overcast, 12 °C",
  "photo": "IMG_4281"
}
```

### 7.3 — Delete a catch

```
DELETE /api/carnet/{id}
```

**Authenticated.** Users can only delete their own catches.

---

## 8. File uploads

### 8.1 — Upload a file

```
POST /api/uploads
```

**Authenticated** (any signed-in user — used both by the admin for product
images and by customers for permit supporting documents).

**multipart/form-data** request (not JSON).

**Fields:**
| Field | Type | Description |
|---|---|---|
| `file` | File | Image to upload |

**Constraints:**
- Allowed extensions: `jpg`, `jpeg`, `png`, `webp`, `gif`, `avif`
- Max size: **8 MB** (returns `413` beyond)

**Response `201`:**
```json
{
  "url": "http://localhost:8080/api/uploads/1745234567890-a1b2c3d4.jpg",
  "filename": "1745234567890-a1b2c3d4.jpg",
  "size": 412890
}
```

**Errors:**
- `400` — no file received
- `413` — file too large
- `415` — extension not supported

### 8.2 — Serve a file

```
GET /api/uploads/{filename}
```

**Public.** HTTP cache 1 year (`Cache-Control: public, max-age=31536000`).

**Errors:**
- `400` — invalid filename (contains `/` or `..`)
- `404` — file not found

---

## 9. Admin statistics

### 9.1 — Overview

```
GET /api/admin/stats
```

**Admin.** Aggregates for the dashboard.

**Response `200`:**
```json
{
  "revenueByMonth": [
    { "key": "2025-11", "label": "Nov 2025", "total": 2480.50, "count": 9 },
    { "key": "2025-12", "label": "Dec 2025", "total": 3120.00, "count": 12 }
  ],
  "newUsersByMonth": [
    { "key": "2026-04", "label": "Apr 2026", "count": 3 }
  ],
  "topProducts": [
    { "productId": "hc-sauvage-9-5", "name": "Rod...", "sku": "HC-C-095-6#4", "qty": 14, "revenue": 6846.0 }
  ],
  "ordersByStatus": { "paid": 18, "shipped": 6, "delivered": 22, "cancelled": 1 },
  "permitsByStatus": { "pending": 4, "approved": 32, "rejected": 2 },
  "categoryRevenue": [
    { "category": "cannes", "revenue": 4500.00 },
    { "category": "leurres", "revenue": 320.00 }
  ],
  "lowStock": [
    { "id": "hc-x", "name": "X rod", "stock": 2, "threshold": 15, "category": "cannes" }
  ],
  "neverSold": [
    { "id": "hc-y", "name": "Y accessory", "stock": 30, "price": 12.50, "category": "accessoires" }
  ],
  "totalRevenue": 18540.50,
  "totalOrders": 47,
  "totalPermits": 38,
  "totalRegistrations": 24,
  "totalUsers": 45,
  "totalBuyers": 32,
  "avgBasket": 175.25,
  "conversionRate": 71.1
}
```

Fields:
- **`avgBasket`**: total revenue / number of paid+ orders (average basket).
- **`conversionRate`**: % of users who bought at least once (simple proxy).
- **`lowStock`**: 8 products with stock ≤ threshold, sorted by ascending stock.
- **`neverSold`**: 6 products that never appeared in an `order_item`, sorted by descending dormant stock.
- **`categoryRevenue`**: revenue aggregated by category, sorted desc.

---

## 10. Product reviews

### 10.1 — List a product's reviews

```
GET /api/products/{id}/reviews
```

**Public.** Sorted by descending date.

**Response `200`:**
```json
[
  {
    "id": 42,
    "productId": "hc-sauvage-9-5",
    "rating": 5,
    "title": "Perfect on the river",
    "comment": "Medium-fast action, soft casts...",
    "verifiedPurchase": true,
    "author": { "firstName": "Marie", "lastName": "D." },
    "createdAt": "2026-04-15T10:12:00Z"
  }
]
```

### 10.2 — Check eligibility

```
GET /api/products/{id}/reviews/eligibility
```

**Authenticated.** Tells whether the user can leave a review.

**Response `200`:**
```json
{ "eligible": true }
```

or:
```json
{ "eligible": false, "reason": "not_purchased" }
```

Possible reasons: `not_logged_in`, `not_purchased`, `already_reviewed`.

### 10.3 — Publish a review

```
POST /api/products/{id}/reviews
```

**Authenticated.** The user must have purchased the product (order in
status `paid`, `shipped` or `delivered`) and must not have left a review yet.

**Request:**
```json
{ "rating": 5, "title": "Optional", "comment": "Minimum 10 characters" }
```

**Errors:**
- `400` — rating outside 1..5, comment too short, no purchase, already reviewed

### 10.4 — Delete a review

```
DELETE /api/reviews/{id}
```

**Authenticated.** Users can only delete their own reviews (admin can delete any).

---

## 11. Wishlist (favorites)

### 11.1 — My favorites

```
GET /api/wishlist
```

**Authenticated.**

### 11.2 — Add to favorites

```
POST /api/wishlist
```

**Authenticated.** Idempotent — re-adding a product that's already a
favorite returns `200` instead of `409`.

**Request:**
```json
{ "productId": "hc-sauvage-9-5" }
```

### 11.3 — Remove from favorites

```
DELETE /api/wishlist/{productId}
```

**Authenticated.** Idempotent too — `204` even if the product isn't in favorites.

---

## 12. Back-in-stock alerts

### 12.1 — Subscribe to an alert

```
POST /api/products/{id}/stock-alerts
```

**Authenticated.** The product must be at **stock = 0**. When the admin
replenishes (transition `0 → >0`), an email is sent automatically.

**Errors:**
- `400` — product already in stock, product not found

### 12.2 — My alerts

```
GET /api/stock-alerts
```

**Authenticated.** List with `notified` flag and `notifiedAt`.

---

## 13. Monthly leaderboard

### 13.1 — Ranking for a month

```
GET /api/leaderboard/monthly?year=2026&month=4&species=truite&limit=10
```

**Public.** All params optional (defaults: current month, all species,
limit 10). Ranks catch log entries by descending size then weight then
entry date.

**Response `200`:**
```json
[
  {
    "rank": 1,
    "species": "truite",
    "taille": 45,
    "poids": 800,
    "spot": "La Têt — Olette",
    "bait": "Sedge olive",
    "catchDate": "2026-04-12",
    "angler": "Marie D."
  }
]
```

### 13.2 — Current-month summary

```
GET /api/leaderboard/summary
```

**Public.** Global top 5 + flagship per-species tops (trout, carp, pike).

---

## 14. Admin CSV exports

All endpoints return a CSV file with UTF-8 BOM + `;` separator (Excel-FR
compatible format).

| Method | Endpoint | Contents |
|---|---|---|
| GET | `/api/admin/exports/orders.csv` | All orders |
| GET | `/api/admin/exports/permits.csv` | All permit requests |
| GET | `/api/admin/exports/contest-registrations.csv` | All contest registrations |

**Admin only.** Dated filename: `hook-cook-commandes-YYYY-MM-DD.csv`.

---

## 15. GDPR

Covers articles 15, 17 and 20 of the regulation. Accessible from `/compte`
→ Settings.

### 15.1 — Export my data

```
GET /api/users/me/export
```

**Authenticated.** Returns a downloadable pretty-printed JSON containing
the profile + every linked entity: orders, permits, contest registrations,
catch log, favorites, reviews, stock alerts.

**Content-Type**: `application/json; charset=UTF-8`
**Content-Disposition**: `attachment; filename="hook-cook-export-{userId}-{YYYY-MM-DD}.json"`

### 15.2 — Delete my account

```
DELETE /api/users/me
```

**Authenticated.** **Irreversible.** The account is anonymised rather
than deleted:

- Email → `anonyme-{id}@deleted.local`
- First/last name/phone/address → emptied
- BCrypt hash → invalidated (no sign-in is possible anymore)
- Wishlist, stock alerts, log, reviews, contest registrations → **deleted**
- Permits → kept but anonymised (name, first name, birthDate, doc URLs)
- Orders → kept 10 years (legal tax obligation) but detached from the identity

**Errors:**
- `400` — cannot anonymise a `ROLE_ADMIN` account

**Response `200`:**
```json
{
  "ok": true,
  "anonymizedAt": "2026-04-21T18:22:00Z",
  "deletions": { "wishlist": 3, "stockAlerts": 0, "carnet": 5, "reviews": 2, "contestRegistrations": 1 },
  "anonymizations": { "permits": 1, "orders": 4 }
}
```

---

## 16. Password reset

Password reset flow over email. No disclosure of whether an account exists
— all responses are identical regardless of the email.

### 16.1 — Request a link

```
POST /api/auth/password-reset/request
```

**Public.** Rate-limited to **3 requests / hour / email**.

**Request:**
```json
{ "email": "user@example.fr" }
```

**Response `200` (always, even if the email is unknown):**
```json
{
  "ok": true,
  "message": "If an account exists with this email, a reset link has been sent."
}
```

An email containing the link `{baseUrl}/reset-password/{token}` is sent if
the email exists. The token is a 128-bit UUID, valid 1 h, single use. All
previous unused tokens for the user are invalidated on each new request.

### 16.2 — Confirm the reset

```
POST /api/auth/password-reset/confirm
```

**Public.** Validates the token and sets the new password.

**Request:**
```json
{ "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", "password": "new-password" }
```

**Errors:**
- `400` — missing token, invalid/expired/already used token, password < 8 chars

**Response `200`:**
```json
{ "ok": true, "email": "user@example.fr" }
```

The user's BCrypt hash is updated, the token is marked `used=true` with
a `usedAt` timestamp.

---

## 17. Stripe payments

### 17.1 — Stripe webhook

```
POST /api/payments/webhook
```

**Public** (no JWT). Security relies on the **HMAC verification** of the
`Stripe-Signature` header against the `STRIPE_WEBHOOK_SECRET`.

Events handled:

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Marks the order as `paid`, decrements stock, sends the confirmation email. Idempotent (safe to replay). |
| `payment_intent.payment_failed` | Marks the order as `payment_failed`, doesn't touch stock. |
| others | Ignored (returns `200` to acknowledge receipt to Stripe). |

**Response `200`:**
```json
{ "received": true }
```

**Errors:**
- `400` — missing or invalid signature
- `503` — `STRIPE_WEBHOOK_SECRET` not configured (refuses to process)

### 17.2 — Local test mode

To relay Stripe webhooks to `localhost:8080`:

```bash
stripe listen --forward-to localhost:8080/api/payments/webhook
```

The CLI prints the `whsec_...` to paste into `.env` as
`STRIPE_WEBHOOK_SECRET`.

**Test cards** (any future date, 3-digit CVC):
- `4242 4242 4242 4242` — success
- `4000 0000 0000 9995` — declined (insufficient funds)
- `4000 0027 6000 3184` — triggers 3D Secure

### 17.3 — Environment variables

| Var | Description | Required |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | To activate Stripe (otherwise: mock mode) |
| `STRIPE_PUBLIC_KEY` | `pk_test_...` or `pk_live_...` | Returned to the front when creating an order |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | To validate webhooks |
| `STRIPE_CURRENCY` | ISO code (default: `eur`) | No |
| `VITE_STRIPE_PUBLIC_KEY` | public key exposed to the browser | Front build |

---

## Data model

Quick view of the persisted entities (see `postgres/init/01-init.sql` for
the full DDL schema).

| Table | Description | Relations |
|---|---|---|
| `users` | Customer and admin accounts | 1..N `orders`, `permits`, `contest_registrations`, `catch_entries` |
| `products` | Sales catalogue | — |
| `categories` | Product categories (reference) | — |
| `techniques` | Fishing techniques (reference) | — |
| `species` | Target species (reference) | — |
| `permit_types` | Permit pricing grid (reference) | — |
| `departments` | Eligible *départements* (reference) | — |
| `orders` | Customer orders | 1..N `order_items`, N..1 `users` |
| `order_items` | Order lines (product snapshot) | N..1 `orders` |
| `permits` | Permit requests | N..1 `users` |
| `contests` | Organised contests | 1..N `contest_registrations` |
| `contest_registrations` | Contest registrations | N..1 `users`, N..1 `contests` |
| `catch_entries` | Catch log | N..1 `users` |
| `product_reviews` | Verified customer reviews | N..1 `users`, N..1 `products` (via `productId` slug) |
| `wishlist_items` | Favorites | N..1 `users`, ref `productId` |
| `stock_alerts` | Back-in-stock notification requests | N..1 `users`, ref `productId`, `notified` flag |
| `password_reset_tokens` | Single-shot tokens for password reset | N..1 `users`, 1 h TTL |

> The `*_csv` columns (e.g. `speciesCsv`, `monthsCsv`) store lists as
> comma-separated strings and are exposed as arrays in the JSON responses.  
> The `*_json` columns (e.g. `variantsJson`, `specsJson`, `historyJson`,
> `itemsJson`) store serialised objects/lists and are deserialised in
> `toApiMap()`.

---

## HTTP status codes

| Code | Meaning |
|---|---|
| `200` | Success (GET, PATCH, PUT) |
| `201` | Resource created (POST) |
| `204` | Success with no body (DELETE) |
| `400` | Invalid data, validation failed |
| `401` | Token missing, invalid or expired |
| `403` | Insufficient rights (not admin, someone else's order…) |
| `404` | Resource not found |
| `409` | Conflict (e.g. `id` already used on creation) |
| `413` | Upload too large |
| `415` | Unsupported file type |
| `500` | Server error |

---

## Integration examples

### cURL — Full customer workflow

```bash
# 1. Sign up
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secretpwd123","firstName":"Alice","lastName":"Martin"}'

# 2. Grab the returned token, then request a permit
TOKEN="eyJhbGc..."
curl -X POST http://localhost:8080/api/permits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"typeId":"annuel","firstName":"Alice","lastName":"Martin","birthDate":"1990-05-12"}'

# 3. List the contests
curl http://localhost:8080/api/contests

# 4. Register to a contest
curl -X POST http://localhost:8080/api/contests/vesoul-2026-05/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"femmes","permitNumber":"FR-2026-48291"}'
```

### JavaScript — Typical call (React frontend)

```javascript
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    email: user.email,
    address: { line, postal, city },
    shippingMode: 'Standard Colissimo',
    shipping: 5.9,
    items: cart.items,
  }),
});
if (!res.ok) throw new Error((await res.json()).error);
const order = await res.json();
```

---

## History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-04-21 | Initial version — covers the 6 modules of the specification |
