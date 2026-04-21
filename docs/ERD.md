# Schéma de la base de données — Hook & Cook

Diagramme entité-relation des tables Postgres, généré depuis les domain
classes Grails (`backend/grails-app/domain/backend/`) et le seed SQL
(`postgres/init/01-init.sql`).

## Vue d'ensemble

```mermaid
erDiagram
    users ||--o{ orders : "passe"
    users ||--o{ permits : "demande"
    users ||--o{ contest_registrations : "inscrit"
    users ||--o{ catch_entries : "consigne"
    users ||--o{ product_reviews : "rédige"
    users ||--o{ wishlist_items : "favori"
    users ||--o{ stock_alerts : "attend"
    users ||--o{ password_reset_tokens : "reset"

    orders ||--|{ order_items : "contient"
    order_items }o--|| products : "snapshot"

    products }o--|| categories : "appartient"
    products }o--o| techniques : "utilise"
    products }o--o{ species : "cible"

    contests ||--o{ contest_registrations : "reçoit"
    contests }o--o{ species : "vise"

    catch_entries }o--|| species : "espèce"

    product_reviews }o--|| products : "note"
    wishlist_items }o--|| products : "cible"
    stock_alerts }o--|| products : "surveille"
    permits }o--|| permit_types : "type"
    permits }o--o| departments : "département"

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
        decimal rating "agrégat calculé"
        int reviews "agrégat calculé"
        string brand
        string water
        string image_url
        text description
        text story
        int low_stock_threshold
        string species_csv "liste des IDs espèces"
        string months_csv "liste des mois d'ouverture"
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
        string id PK "annuel|semaine|decouverte"
        string title
        string label
        decimal price
        text items_json
    }

    departments {
        string id PK "code dept (66, 11, ...)"
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
        string category "hommes-exp|hommes-am|femmes|jeunes"
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

## Relations clés

| Relation | Cardinalité | Particularités |
|---|---|---|
| `users` → `orders` | 1..N | `user_id` nullable:false |
| `orders` → `order_items` | 1..N | cascade delete, snapshot produit (pas de FK dure vers products) |
| `users` → `permits` | 1..N | un utilisateur peut avoir plusieurs permis historiques |
| `users` → `contest_registrations` | 1..N | index unique (`user_id`, `contest_id`) via logique applicative |
| `contests` → `contest_registrations` | 1..N | compteur `inscrits` dénormalisé sur `contests` |
| `users` → `catch_entries` | 1..N | le carnet de prises est privé par défaut |
| `users` → `product_reviews` | 1..N | contrainte applicative : un seul avis par couple (user, product) |
| `users` → `wishlist_items` | 1..N | un seul item par couple (user, product) — idempotence côté service |
| `users` → `stock_alerts` | 1..N | alertes actives filtrables via `notified = false` |
| `users` → `password_reset_tokens` | 1..N | anciens tokens invalidés à chaque nouvelle demande |
| `products` ↔ `species` | N..N | stocké en CSV dans `species_csv` (pas de table de jointure) |
| `products` ↔ `months` | N..N | idem, CSV dans `months_csv` |

## Conventions

- **IDs en slug** pour les entités référentielles (`products`, `categories`, `species`, etc.) → URLs lisibles.
- **IDs auto-increment Hibernate** pour les entités transactionnelles (`users`, `orders`, `permits`, …).
- **Références UUID-dérivées** (`HC-2186-XXXXXXXX`, `FR-2026-XXXXXXXXXX`) pour les entités exposées au client, pour éviter l'énumération.
- **JSON en texte** pour les colonnes `*_json` (variants, specs, history, items) : désérialisées via Groovy `JsonSlurper` dans le getter `toApiMap()` des domain classes.
- **CSV pour les listes courtes** (`species_csv`, `months_csv`) : pratique pour les requêtes `LIKE '%,truite,%'`, évite une table de jointure dédiée pour une cardinalité faible.

## Indexes explicites

Tous déclarés via `static mapping { }` dans les domains :

| Table | Index | Colonne |
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

## Génération et évolution du schéma

- **Première exécution** : `postgres/init/01-init.sql` (chargé automatiquement par l'image Postgres au premier boot d'un volume vide) crée tout le schéma + le référentiel métier.
- **Évolutions ultérieures** : Grails est configuré avec `dbCreate: update` (voir `backend/grails-app/conf/application.yml`). Les colonnes et tables ajoutées dans les domains sont créées automatiquement au prochain démarrage.
- **BootStrap** (`backend/grails-app/init/backend/BootStrap.groovy`) seed idempotemment les tables ajoutées après le dump initial : `permit_types`, `departments`, et le compte admin (depuis `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- **Dump de l'état courant** : `bash scripts/dump.sh` régénère `01-init.sql` depuis la BDD live (utile avant un commit).

## Rendu visuel

Le bloc Mermaid ci-dessus est directement rendu par GitHub dans l'onglet « Preview » de ce fichier. Pour obtenir un export PNG / SVG haute définition :

- Copier le bloc dans [mermaid.live](https://mermaid.live)
- Ou installer la CLI Mermaid : `npm install -g @mermaid-js/mermaid-cli` puis `mmdc -i docs/ERD.md -o docs/ERD.png`
