# User guide — Hook & Cook

Step-by-step guide to browse the shop, request a fishing permit, register for
a contest and use account features (favorites, reviews, catch log, GDPR).

---

## 1. Create an account

1. Click the **user** icon at the top right → **Sign in**
2. At the bottom of the screen, click **Create an account**
3. Fill in first name, last name, email and password (minimum 8 characters)
4. You are automatically signed in and redirected to **My account**

Your session stays alive for 12 h. Reloading the page keeps you signed in.

## 2. Forgotten password

If you forgot your password:

1. On the **Sign in** page, click **Forgot your password?** (under the password field)
2. Type the email of your account
3. If an account with that email exists, you receive an email with a link
   (valid **1 hour**, **single use**)
4. Click the link → type your new password twice → confirm
5. Automatically redirected to the sign-in page — you can sign in again with the new password

The message displayed is always the same whether the email exists or not
(anti-enumeration security).

## 3. Browse the shop

Access **Shop** from the navigation or via the URL `/boutique`.

**Filter:**
- **Category** — rods, reels, lures, clothing…
- **Target species** — trout, pike, carp…
- **Technique** — fly, predator, bottom fishing…
- **In stock** — hides items currently out of stock
- **Search bar** — free text with typo tolerance (type "cane" → finds "canne")

**Sort** — by relevance, ascending/descending price, or best rated.

Click a card to see the full **product page** (gallery, variants, technical
specs, seasonality, artisan story, reviews, frequently bought together).

### Add a product to favorites

On every product card and product page, click the **heart** at the top right
to add or remove from favorites. Find the list under **My account → Favorites**.

### Get notified when back in stock

On a product page that is **out of stock**, the "Add to cart" button is
replaced with **"Notify me when available"**. One click signs your email up;
you get an automated email as soon as the admin restocks.

## 4. Buy an item

1. On the product page or thumbnail, click **Add to cart**
2. The counter in the top nav increments
3. Click the **cart** icon to review the summary
4. Adjust quantities or remove an item
5. Click **Place order**
6. Fill in 3 steps:
   - **Contact** (email, first name, last name, phone)
   - **Shipping** (address + method: Standard 48 h / Chronopost 24 h / Pickup point)
   - **Payment** (card — Stripe mocked for now)
7. Your order gets a reference `HC-2186-XXXXXXXX`

On the confirmation page and under **My account → Orders**, you can
**download the PDF invoice** of any order in one click.

Find all your orders in **My account → Orders** with their status (paid,
shipped, delivered).

## 5. Leave a product review

1. Open the page of a product you purchased (orders in status `paid`, `shipped` or `delivered`)
2. Click the **Reviews** tab
3. If you are eligible, a form appears:
   - **5-star** rating (mandatory)
   - **Title** (optional)
   - **Comment** (minimum 10 characters)
4. Click **Publish my review** — it appears instantly with a **"Verified purchase"** badge

Rules:
- Only customers who bought the product can leave a review
- One review per person per product
- The product's average rating updates automatically

## 6. Request a fishing permit

1. Open **Permits** in the navigation
2. Click **Start my application**
3. Walk through the 5 steps:
   - **Type** — yearly (€92) / weekly (€28) / trial (€6)
   - **Identity** — first name, last name, birth date, *département*
   - **Supporting documents** — actual upload of ID card + photo (JPG/PNG/WebP, max 8 MB)
   - **Summary** — review and accept the T&Cs
   - **Payment** — card
4. Your permit gets a reference `FR-2026-XXXXXXXXXX`
5. The **tracking** screen shows a real-time timeline:
   - ✓ Application sent
   - ✓ Payment confirmed
   - ✓ Under review (federation)
   - ⏳ Decision

You receive an email (via configured SMTP, otherwise logged server-side) as
soon as your permit is approved or rejected by the administrator.

The uploaded documents are accessible only to you and the administrators.

## 7. Register for a contest

1. Open **Contests**
2. Filter by species (All / Trout / Predator / Carp)
3. Click a contest in the left list to see its detailed sheet, or a pin on the
   Leaflet map on the right
4. Click **Register**
5. Pick your category (Men Pro / Amateur / Women / Junior)
6. Verify your permit number
7. Click **Confirm my registration**

Your registrations are listed under **My account → Contests**.

## 8. Take part in the monthly challenges

The site organises a **monthly ranking** of the biggest catches logged by
the community.

1. Open **Challenges** in the navigation
2. Filter by month, year and species
3. The top 3 appears with medals 🥇🥈🥉

To take part, just add your catches to your log (see section 9).

## 9. My account

Accessible via `/compte` or the user icon.

**Available tabs:**

- **Overview** — stats (permits, catches logged, orders, contests)
- **Orders** — history with details, shipping status, PDF invoice download
- **Permits** — your current permit with timeline
- **Contests** — list of contests you registered for
- **Catch log** — personal journal of fish caught
- **Favorites** — products added via the heart on cards
- **Addresses** — display of your shipping address
- **Settings** — profile, sign out, **GDPR section**

**Add a catch to the log:**
1. **Catch log** tab → **+ Add a catch** button
2. Select the species, fill in size, weight, location, bait, date
3. Save — the card appears in your catch grid

Tip: URLs like `/compte#carnet` or `/compte#favoris` jump straight to the
right tab (handy to share a link).

## 10. GDPR rights (export and deletion)

In **My account → Settings**, the **Personal data · GDPR** section offers:

### Download my data

Click **Export** → a JSON file is downloaded containing all your data:
profile, orders, permits, contest registrations, log, favorites, reviews,
stock alerts.

Compliant with article 15 (right of access) and article 20 (portability)
of the GDPR.

### Delete my account

**Irreversible** action. Procedure:

1. Click **Delete my account**
2. A red panel appears with a confirmation field
3. Type the word **SUPPRIMER** (uppercase, French for "delete")
4. Click **Delete permanently**

Effects:
- **Data deleted** immediately: favorites, stock alerts, log, reviews, contest registrations
- **Data anonymised**: permits (first/last name/birth date wiped), orders (address replaced, email anonymised) — these are kept for 10 years due to fiscal/legal obligation but are no longer linked to your identity
- **Sign-in impossible**: your BCrypt hash is invalidated

Compliant with article 17 (right to erasure).

## 11. Sign out

**My account → Settings → Sign out**

Your token is removed from the browser. You become an anonymous visitor again.

---

## Useful URL shortcuts

| URL | What it opens |
|---|---|
| `/boutique?category=cannes` | Shop filtered on rods |
| `/boutique?species=truite` | Shop filtered on trout species |
| `/compte#favoris` | My favorites directly |
| `/compte#carnet` | My catch log directly |
| `/compte#parametres` | GDPR / sign out section |
| `/a-propos#histoire` | Store history |
| `/aide` | Full FAQ |
| `/legal/cgv`, `/legal/mentions-legales`, etc. | Legal pages |
| `/mot-de-passe-oublie` | Start a password reset |
