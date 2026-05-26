---
hide:
  - navigation
  - toc
---

# Hook & Cook

**Online fishing tackle shop, permit handling and local fishing contests.**
Secure layered application — capstone project for the **CDA TP-01281** French
state diploma (Application Designer-Developer, EQF level 6).

<div class="badges" markdown>
![Grails](https://img.shields.io/badge/Grails-6.2-48b983?logo=grails&logoColor=white)
![Groovy](https://img.shields.io/badge/Groovy-3-4298b8?logo=apachegroovy&logoColor=white)
![Spring](https://img.shields.io/badge/Spring%20Boot-3-6db33f?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff?logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)
</div>

## Where to start?

<div class="grid cards" markdown>

-   :material-sitemap:{ .lg .middle } &nbsp; **Architecture**

    ---

    Layered architecture, SQL + NoSQL choice justified by data nature, DICP
    per layer, eco-design.

    [→ Read the architecture docs](ARCHITECTURE.md)

-   :material-api:{ .lg .middle } &nbsp; **REST API**

    ---

    Full endpoint reference: authentication, products, orders, permits,
    contests, Stripe payments, GDPR…

    [→ API reference](API.md)

-   :material-database:{ .lg .middle } &nbsp; **Data model**

    ---

    Entity-relationship diagram, Postgres tables, constraints, foreign keys.
    Derived from GORM domain classes and SQL seed.

    [→ Relational model](ERD.md)

-   :material-flask-outline:{ .lg .middle } &nbsp; **Test plan**

    ---

    The 7 types of tests in place: unit, integration, regression, E2E
    Playwright, k6 load, OWASP ZAP security, user acceptance.

    [→ Test plan](PLAN-TESTS.md)

-   :material-shield-search:{ .lg .middle } &nbsp; **Tech watch & security**

    ---

    Monitored sources, automation tools (Dependabot), weekly routine,
    real-world applications and a vulnerability found + fixed.

    [→ Tech watch and security](VEILLE.md)

-   :material-chart-line:{ .lg .middle } &nbsp; **A11y + perf + eco audits**

    ---

    Lighthouse, Pa11y (WCAG 2.0 AA) and Ecoindex audits on 5 key pages.
    Scores, prioritized action plan, interactive HTML reports.

    [→ See the audits](AUDITS.md)

-   :material-account-circle:{ .lg .middle } &nbsp; **User guide**

    ---

    Step-by-step customer journey: account, cart, payment, permits,
    contests, catch log, favorites, GDPR.

    [→ User guide](GUIDE-UTILISATEUR.md)

-   :material-shield-account:{ .lg .middle } &nbsp; **Admin guide**

    ---

    Admin dashboard: catalogue, orders, permits, contests, stats, CSV
    export, emails.

    [→ Admin guide](GUIDE-ADMIN.md)

-   :material-github:{ .lg .middle } &nbsp; **Source code**

    ---

    The repo, issues, pull requests. Code is the source of truth, this
    documentation complements it.

    [→ See on GitHub](https://github.com/S7venz/hook-cook)

</div>

## Two-command quickstart

```bash
git clone https://github.com/S7venz/hook-cook.git
cd hook-cook
cp .env.example .env
docker compose up -d
```

!!! tip "Zero configuration required"
    The defaults in `.env.example` are designed for **clone-and-run**:
    Postgres locally, Redis locally, emails logged to console, Stripe in
    mock mode (orders/permits/contests validated directly without real
    payment). Demo seed enabled: 10 users, 18 orders, 6 permits, 10
    contest registrations, and more.

Once containers are up:

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| REST API | <http://localhost:8080> |
| Healthcheck | <http://localhost:8080/actuator/health> |

**Default admin account**: `admin@hookcook.fr` / `admin1234demo`

## Feature scope

=== ":material-cart: Shop"

    - Catalogue of 11 seed products (with images) — categories, techniques, target species
    - Search, sort (price, newest, popularity), price filter
    - Persistent cart (localStorage), 3-step checkout
    - Stripe payment (PaymentIntent + signed webhook) or automatic mock mode
    - Moderated product reviews, favorites, back-in-stock alerts

=== ":material-fish: Permits"

    - 3 permit types (yearly, weekly, daily) across 4 eligible *départements*
    - Digital application with attachments (ID, supporting document)
    - Admin validation, Stripe payment, PDF generation + email delivery

=== ":material-trophy: Contests"

    - 4 seeded local contests (Perpignan area) with dates, location, type
    - Paid user registration via Stripe
    - Admin drilldown to view contestants per event

=== ":material-notebook: Catch log"

    - Catch entry: species, size, weight, date, location, photo
    - Monthly leaderboard (per species or global) with documented tie-breaking rules
    - Privacy: first name + last name initial only on public views

=== ":material-shield-lock: Security"

    - JWT HS512 + BCrypt 12 rounds
    - Anti brute-force rate-limit shared via **Redis**
    - Stripe webhook idempotency (deduplication of re-deliveries)
    - Strict CSP at the nginx layer, GDPR (export + account deletion)

## Tech watch and continuous improvement

!!! info "Educational project"
    This documentation accompanies the **CDA project portfolio**. It is versioned
    alongside the code (`docs/` in the repo) and rebuilt automatically by
    **MkDocs Material** on every push to `main` via GitHub Actions.

---

<center>
*Hook & Cook — Cengizhan Özbek — 2026*
</center>
