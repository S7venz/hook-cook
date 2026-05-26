# Administrator guide — Hook & Cook

Operating manual for the admin dashboard.

---

## Reaching the admin

1. Sign in with a **ROLE_ADMIN** account (credentials defined in `.env`:
   `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
2. Navigate manually to `/admin` in the URL bar
3. The sidebar displays 6 sections: Overview, **Statistics**, Orders,
   Permits, Contests, Products

If you are signed in with a standard user account (ROLE_USER), you are
redirected to `/403` with an explicit message. Backend endpoints
consistently return 403 without the proper role.

## Overview

KPIs displayed:
- **Total revenue** — sum of all order totals
- **Orders to ship** — number of orders with status `paid`
- **Pending permits** — number of permits with status `pending`
- **Contest registrations** — total cumulative registrations

**Recent orders** panel — the last 4 orders with status.

**Critical stock** panel — products with stock < threshold; clicking
*Restock* jumps to the Products section.

## Statistics (dedicated tab)

Since v2, the **Statistics** tab provides a real business dashboard:

### KPIs (first row)
- **Total revenue** — sum of order totals
- **Average basket** — total revenue / number of paid+ orders (in €)
- **Conversion rate** — % of users who bought at least once
- **Unique buyers** — N buyers / total signed-up users

### KPIs (second row)
- **Orders**, **Permits issued**, **Contest registrations**
- **Critical stock** — number of products ≤ threshold (red if 0)

### Revenue per month chart
Native SVG histogram over the last 6 sliding months. Each bar displays the
monthly total.

### Status breakdowns
Two columns: orders by status (paid/shipped/delivered/cancelled) and
permits by status (pending/approved/rejected).

### Top 5 sold products
Ranking by quantity sold (all orders included), with revenue generated.

### Critical stock & Never sold
Two side-by-side panels:
- **Critical stock** — up to 8 products under threshold, sorted by ascending
  stock (red if 0, orange otherwise)
- **Never sold** — up to 6 products that don't appear in any `order_item`,
  sorted by dormant stock descending

### Revenue per category
Table of aggregated revenue per category (rods, lures, etc.) with the
percentage share of total revenue.

## Managing products

### Add a product

1. **Products** section → **+ Add a product** button
2. Fill the form:
   - **Identifier (slug)** — required, e.g. `hc-my-new-rod`
   - **SKU** — internal reference (required)
   - **Name, Category** — required
   - **Technique, Brand** — optional
   - **Price** (€) — required ≥ 0
   - **Strikethrough price** — optional (shows a Promo badge if present)
   - **Stock** — required ≥ 0
   - **Rating / Review count** — optional (recomputed automatically as soon
     as a review is published)
   - **Water type** — river, lake, sea…
   - **Species** — comma-separated list (e.g. `trout, grayling, perch`)
   - **Photo URL** — direct upload or paste a URL. A preview appears under
     the field.
   - **Description**
3. Click **Create product**

### Edit / Delete a product

As before — buttons on each row.

Important: products already ordered remain referenced in the orders
(snapshot at the time of purchase).

### Stock handling

To quickly adjust stock:
- Edit the product and update only the Stock field
- Or use the **+10** button on the row for a quick increment

**Notable**: when a product goes from `stock = 0` to `stock > 0` via a
replenish, all users signed up for **back-in-stock alerts** receive an
automatic email.

## Managing orders

**Orders** section — table of all orders.

**Available actions depending on status:**
- `paid` → click **Mark shipped** → moves to `shipped`
- `shipped` → click **Mark delivered** → moves to `delivered`

Each change updates the user-side status (visible in their account).

**"Export CSV" button** in the section header → downloads all orders in
Excel-FR compatible format (UTF-8 BOM + `;` separator), dated filename.

## Managing permits

**Permits** section — all permit requests.

**Actions on a pending request:**
- **Approve** → status moves to `approved`, automatic email to the requester
- **Reject** → status moves to `rejected`, automatic email

The user's timeline is updated automatically with the decision date.

**Documents** column — clickable links to the uploaded ID and photo.
Access is secured (admin only or permit owner, JWT auth required, URLs
backed by 128-bit UUIDs).

**"Export CSV" button** also available on this section.

## Managing contests

### Add a contest

**Contests** section → **+ Add a contest** → fill:
- **Identifier (slug)** — e.g. `tet-2026-07`
- **Title, Location** — required
- **ISO date** — format `YYYY-MM-DD`
- **Display date** — format `DD MONTH` (e.g. `12 JUL`)
- **Distance, Format, Price, Registrations, Max spots**
- **Species** — comma-separated slugs
- **Rules** — free text

### Edit / Delete

**Edit** and **Delete** buttons on each row. Deleting also removes every
registration for that contest (counters decremented).

**"Export registrations CSV" button** in the header → downloads every
registration (contest, contestant, category, permit number).

## Categories / Techniques / Species / Permit types / Departments

Managed **only via the backend API** for now (no dedicated admin UI).
Routes:

```
POST/PUT/DELETE  /api/categories[/:id]
POST/PUT/DELETE  /api/techniques[/:id]
POST/PUT/DELETE  /api/species[/:id]
GET              /api/permit-types     (public, read-only)
GET              /api/departments      (public, read-only)
```

All protected by `ROLE_ADMIN`. Permit types and departments are seeded by
`BootStrap.groovy` at startup.

## Demo seed

To populate the environment with realistic data at first boot:

```bash
# in .env
HC_SEED_DEMO=true
```

At backend startup, `DemoSeedData.seedIfNeeded()` injects (if
`marie.dupont@demo.hookcook.fr` does not already exist):

- **10 French users** with addresses in dept. 66 / Occitanie region (all share password `demo1234`)
- **18 orders** spread across 6 months (17 valid + 1 cancelled)
- **6 permits**: 4 approved, 1 pending, 1 rejected
- **10 contest registrations**
- **8 verified customer reviews**
- **6 catch log entries** across Têt/Tech/Vinça/Agly rivers
- **7 favorites** spread across users

Idempotent: if you re-run with `HC_SEED_DEMO=true`, nothing is duplicated.

To switch to a clean mode (no demo data):

```bash
# Stop, wipe the volumes, restart with HC_SEED_DEMO= empty
docker compose down -v
# then edit .env: HC_SEED_DEMO=
docker compose up -d
```

## Sign out

Admin sidebar → **Sign out** at the bottom.

## Useful shortcuts

**Inspect the Postgres database:**
```bash
docker exec -it hook-cook-postgres-1 psql -U hookcook -d hookcook
```

**Full reset (wipes everything — automatic seed at next boot):**
```bash
bash scripts/reset.sh
```

**Dump current state (before commit):**
```bash
bash scripts/dump.sh
```

**Backend logs — emails:**
- If `SMTP_HOST` is configured in `.env`, mails are actually sent
- Otherwise, email notifications (permit decision, order confirmation,
  contest registration, back-in-stock, password reset) are logged in the
  Grails terminal

## Production security

Before deploying to production:

1. `HC_JWT_SECRET` ≥ 64 chars in `.env` (otherwise the backend refuses to
   start in `production` profile)
2. Strong `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (otherwise the backend
   refuses to start)
3. CORS: adjust `backend/src/main/groovy/backend/config/CorsConfig.groovy`
   to the production domain
4. Real SMTP configured for notifications (otherwise they stay in logs)
5. `HC_SEED_DEMO=` (empty) so fake users aren't injected
6. Docker Compose: Postgres is already bound to `127.0.0.1:5432` (safe)
7. The backend container runs as non-root user `app:10001`
8. HTTP security headers already set by nginx (CSP, X-Frame-Options,
   Referrer-Policy, etc.)
9. Active rate limits on `/login` (5/10 min) and `/register` (3/h)

See `README.md`, **Security** section, for the full breakdown.
