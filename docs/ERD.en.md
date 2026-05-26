# Database schema — Hook & Cook

Entity-relationship diagram of the Postgres tables, derived from the
Grails domain classes (`backend/grails-app/domain/backend/`) and the SQL
seed (`postgres/init/01-init.sql`).

## Overview

```mermaid
erDiagram
    users ||--o{ orders : "places"
    users ||--o{ permits : "requests"
    users ||--o{ contest_registrations : "registers"
    users ||--o{ catch_entries : "logs"
    users ||--o{ product_reviews : "writes"
    users ||--o{ wishlist_items : "favorites"
    users ||--o{ stock_alerts : "watches"
    users ||--o{ password_reset_tokens : "resets"

    orders ||--|{ order_items : "contains"
    order_items }o--|| products : "snapshot"

    products }o--|| categories : "belongs to"
    products }o--o| techniques : "uses"
    products }o--o{ species : "targets"

    contests ||--o{ contest_registrations : "receives"
    contests }o--o{ species : "targets"

    catch_entries }o--|| species : "species"

    product_reviews }o--|| products : "rates"
    wishlist_items }o--|| products : "targets"
    stock_alerts }o--|| products : "watches"
    permits }o--|| permit_types : "type"
    permits }o--o| departments : "department"

    users {
        bigint id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone
        string address_line
        string postal_code
        string city
        string country
        string role "ROLE_USER | ROLE_ADMIN"
        timestamp date_created
        timestamp last_updated
    }

    products {
        string id PK "slug"
        string sku
        string name
        string category FK
        string technique FK
        decimal price
        decimal was_price
        int stock
        decimal rating "computed aggregate"
        int reviews "computed aggregate"
        string brand
        string water
        string image_url
        text description
        text story
        int low_stock_threshold
        string species_csv "comma-separated species IDs"
        string months_csv "comma-separated open months"
        text variants_json
        text specs_json
    }

    categories {
        string id PK "slug"
        string name
        int display_count
    }

    techniques {
        string id PK "slug"
        string name
    }

    species {
        string id PK "slug"
        string name
        string latin
        string water
        string image_url
        string months_csv
    }

    orders {
        bigint id PK
        string reference UK "HC-2186-XXXXXXXX"
        bigint user_id FK
        decimal subtotal
        decimal shipping
        decimal total
        string email
        string address_line
        string postal_code
        string city
        string shipping_mode
        string status "paid|shipped|delivered|cancelled"
        string status_label
        timestamp date_created
    }

    order_items {
        bigint id PK
        bigint order_id FK
        string product_id FK
        string product_name
        string product_sku
        string product_brand
        string product_image_url
        decimal unit_price
        int qty
    }

    permits {
        bigint id PK
        string reference UK "FR-2026-XXXXXXXXXX"
        bigint user_id FK
        string type_id FK
        string type_title
        decimal amount
        string department
        string first_name
        string last_name
        string birth_date
        string status "pending|approved|rejected"
        string status_label
        text history_json
        string id_doc_url
        string photo_doc_url
        timestamp date_created
    }

    permit_types {
        string id PK "annual|weekly|trial"
        string title
        string label
        decimal price
        text items_json
    }

    departments {
        string id PK "dept code (66, 11, ...)"
        string name
    }

    contests {
        string id PK "slug"
        string title
        string date "ISO YYYY-MM-DD"
        string date_display
        string lieu
        string distance
        string format
        decimal price
        int inscrits
        int max
        text reglement
        string species_csv
    }

    contest_registrations {
        bigint id PK
        bigint user_id FK
        string contest_id FK
        string category "men-pro|men-amateur|women|junior"
        string permit_number
        timestamp date_created
    }

    catch_entries {
        bigint id PK
        bigint user_id FK
        string species FK
        int taille "cm"
        int poids "g"
        string spot
        string bait
        string weather
        string photo_label
        string catch_date "ISO"
    }

    product_reviews {
        bigint id PK
        string product_id FK
        bigint user_id FK
        int rating "1..5"
        string title
        text comment
        boolean verified_purchase
        timestamp date_created
    }

    wishlist_items {
        bigint id PK
        bigint user_id FK
        string product_id FK
        timestamp date_created
    }

    stock_alerts {
        bigint id PK
        bigint user_id FK
        string product_id FK
        boolean notified
        timestamp notified_at
        timestamp date_created
    }

    password_reset_tokens {
        bigint id PK
        bigint user_id FK
        string token UK "UUID 128 bits"
        timestamp expires_at "TTL 1h"
        boolean used
        timestamp used_at
        timestamp date_created
    }
```

## Key relationships

| Relationship | Cardinality | Notes |
|---|---|---|
| `users` → `orders` | 1..N | `user_id` not nullable |
| `orders` → `order_items` | 1..N | cascade delete, product snapshot (no hard FK to `products`) |
| `users` → `permits` | 1..N | one user may hold several historical permits |
| `users` → `contest_registrations` | 1..N | unique index (`user_id`, `contest_id`) enforced at the service level |
| `contests` → `contest_registrations` | 1..N | denormalised `inscrits` counter on `contests` |
| `users` → `catch_entries` | 1..N | catch log is private by default |
| `users` → `product_reviews` | 1..N | service-level constraint: a single review per (user, product) |
| `users` → `wishlist_items` | 1..N | one item per (user, product) — idempotent at the service level |
| `users` → `stock_alerts` | 1..N | active alerts filterable via `notified = false` |
| `users` → `password_reset_tokens` | 1..N | older tokens invalidated on each new request |
| `products` ↔ `species` | N..N | stored as CSV in `species_csv` (no join table) |
| `products` ↔ `months` | N..N | likewise, CSV in `months_csv` |

## Conventions

- **Slug IDs** for reference entities (`products`, `categories`, `species`, etc.) → readable URLs.
- **Hibernate auto-increment IDs** for transactional entities (`users`, `orders`, `permits`, …).
- **UUID-derived references** (`HC-2186-XXXXXXXX`, `FR-2026-XXXXXXXXXX`) for entities exposed to clients, to prevent enumeration.
- **JSON-in-text** for `*_json` columns (variants, specs, history, items): deserialised via Groovy `JsonSlurper` in the `toApiMap()` getters of the domain classes.
- **CSV for short lists** (`species_csv`, `months_csv`): handy for `LIKE '%,truite,%'` queries and avoids a dedicated join table at low cardinalities.

## Explicit indexes

All declared via `static mapping { }` in the domain classes:

| Table | Index | Column |
|---|---|---|
| `users` | `users_email_idx` | `email` |
| `orders` | `orders_reference_idx` | `reference` |
| `orders` | `orders_user_idx` | `user_id` |
| `permits` | `permits_reference_idx` | `reference` |
| `permits` | `permits_user_idx` | `user_id` |
| `contest_registrations` | `contest_reg_user_idx` | `user_id` |
| `contest_registrations` | `contest_reg_contest_idx` | `contest_id` |
| `catch_entries` | `catch_entries_user_idx` | `user_id` |
| `product_reviews` | `product_reviews_product_idx` | `product_id` |
| `product_reviews` | `product_reviews_user_idx` | `user_id` |
| `wishlist_items` | `wishlist_user_idx` | `user_id` |
| `wishlist_items` | `wishlist_product_idx` | `product_id` |
| `stock_alerts` | `stock_alerts_user_idx` | `user_id` |
| `stock_alerts` | `stock_alerts_product_idx` | `product_id` |
| `password_reset_tokens` | `pwd_reset_token_idx` (unique) | `token` |
| `password_reset_tokens` | `pwd_reset_user_idx` | `user_id` |

## Schema generation and evolution

- **First run**: `postgres/init/01-init.sql` (loaded automatically by the Postgres image at first boot of an empty volume) creates the full schema and the business reference data.
- **Subsequent evolutions**: Grails is configured with `dbCreate: update` (see `backend/grails-app/conf/application.yml`). Columns and tables added in the domain classes are created on the next startup.
- **BootStrap** (`backend/grails-app/init/backend/BootStrap.groovy`) idempotently seeds tables added after the initial dump: `permit_types`, `departments`, and the admin account (from `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- **Dumping the current state**: `bash scripts/dump.sh` regenerates `01-init.sql` from the live DB (handy before a commit).

## Visual rendering

The Mermaid block above is rendered directly by GitHub in the "Preview" tab of this file. For a high-resolution PNG / SVG export:

- Paste the block into [mermaid.live](https://mermaid.live)
- Or install the Mermaid CLI: `npm install -g @mermaid-js/mermaid-cli` then `mmdc -i docs/ERD.md -o docs/ERD.png`
