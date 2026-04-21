# Hook & Cook

Application web de gestion d'un magasin d'articles de pêche — boutique en ligne,
demandes de permis, inscriptions aux concours locaux, tableau de bord admin.

Projet développé dans le cadre d'un module de développement web.

## Stack

| Couche | Technologie |
|---|---|
| Backend | Grails 6 (Groovy) — API REST |
| Base de données | PostgreSQL 16 |
| Auth | JWT + BCrypt (rôles `ROLE_USER` / `ROLE_ADMIN`) |
| Frontend | React 19 + Vite |
| Routing | react-router-dom |
| Paiement | Stripe / PayPal (mocké pour l'instant) |
| Conteneurisation | Docker + docker-compose |

## Démarrage rapide (tout-en-un via Docker)

```bash
git clone https://github.com/S7venz/hook-cook.git
cd hook-cook
cp .env.example .env       # puis éditer .env pour mettre de vrais secrets
bash scripts/start.sh      # équivaut à "docker compose up --build"
```

Une fois les 3 conteneurs up :
- Frontend : http://localhost:5173
- API : http://localhost:8080
- Postgres : localhost:5432

Au premier boot, Postgres applique automatiquement [`postgres/init/01-init.sql`](postgres/init/01-init.sql) — tu récupères donc 11 produits (avec images), 4 concours localisés Perpignan, 6 catégories, 6 techniques, 8 espèces et le compte admin. Les images sont dans [`backend/uploads/`](backend/uploads) et copiées dans le volume au premier boot du backend. Le `BootStrap` ajoute en plus 3 types de permis et 4 départements éligibles dans les tables de référence.

**Compte admin** : email + mot de passe définis dans ton `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). Par défaut, `admin@hookcook.fr` / `admin1234`.

## Sauvegarder l'état en cours

En fin de session, `bash scripts/stop.sh` dump la BDD + sync les uploads dans le repo, puis arrête les conteneurs. Comme ça tout ce que tu as ajouté (users, commandes, permis…) est versionné avec `git add` / `git commit`.

| Commande | Effet |
|---|---|
| `bash scripts/start.sh` | `docker compose up --build` (vérifie `.env`) |
| `bash scripts/stop.sh` | Dump BDD + uploads → `docker compose down` |
| `bash scripts/dump.sh` | Dump uniquement (conteneurs restent up) |
| `bash scripts/reset.sh` | Reset volumes + re-seed depuis le dump |

Voir [`scripts/README.md`](scripts/README.md) pour le détail.

## Développement en local (sans Docker)

### Prérequis

- **JDK 17** (Temurin recommandé) — `java -version` doit afficher 17
- **Node.js 20+**
- **Docker** (pour Postgres uniquement)

### Postgres

```bash
docker compose up -d postgres
```

### Backend

```bash
cd backend
./grailsw run-app       # Linux / macOS
.\grailsw run-app       # Windows (PowerShell)
# puis dans le shell grails>
run-app
```

Au premier démarrage (sans Docker), tu dois d'abord importer le seed :

```bash
docker exec -i hookcook-postgres-1 psql -U hookcook -d hookcook < postgres/init/01-init.sql
```

Ou utilise la stack Docker complète (recommandé) — le seed est alors appliqué automatiquement.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Accessible sur http://localhost:5173.

## Structure du projet

```
hook-cook/
├── backend/                Application Grails
│   ├── grails-app/
│   │   ├── controllers/    AuthController, ProductController, OrderController…
│   │   ├── services/       AuthService, OrderService, PermitService, CarnetService…
│   │   ├── domain/         User, Product, CustomerOrder, Permit, Contest…
│   │   ├── init/           BootStrap (seed initial)
│   │   └── conf/           application.yml
│   ├── src/main/groovy/backend/config/  CorsConfig
│   └── Dockerfile
├── frontend/               Application React
│   ├── src/
│   │   ├── components/     UI (ProductCard, TopNav, Providers…)
│   │   ├── pages/          HomePage, CataloguePage, AdminPage…
│   │   ├── lib/            api.js, auth.js, cart.js, orders.js…
│   │   └── styles/         tokens.css, prototype.css
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Endpoints API

### Auth (public / authenticated)
| Méthode | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter, retourne JWT |
| GET  | `/api/auth/me` | Identité courante (Bearer token) |

### Catalogue (public)
| Méthode | Path | Description |
|---|---|---|
| GET | `/api/products` | Liste complète ou paginée (`?page=0&size=20`) |
| GET | `/api/products/:id` | Détail |
| GET | `/api/products/:id/related` | Souvent acheté avec (co-occurrence + fallback catégorie) |
| GET | `/api/products/:id/reviews` | Avis clients vérifiés |
| GET | `/api/categories`, `/api/techniques`, `/api/species` | Référentiels |
| GET | `/api/contests`, `/api/contests/:id` | Concours |
| GET | `/api/permit-types`, `/api/departments` | Grille tarifaire + départements éligibles |
| GET | `/api/leaderboard/monthly` | Classement mensuel des prises |

### Commandes (user)
| Méthode | Path | Description |
|---|---|---|
| POST | `/api/orders` | Créer une commande depuis le panier |
| GET | `/api/orders/me` | Mes commandes |
| GET | `/api/orders/:ref` | Détail (owner ou admin) |

### Permis (user)
| Méthode | Path | Description |
|---|---|---|
| POST | `/api/permits` | Soumettre une demande (avec `idDocUrl` + `photoDocUrl`) |
| GET | `/api/permits/me` | Ma demande en cours |

### Uploads (authentifié)
| Méthode | Path | Description |
|---|---|---|
| POST | `/api/uploads` | Multipart — upload de pièce permis ou image produit (magic bytes vérifiés) |
| GET | `/api/uploads/:filename` | Sert le fichier. Public pour images produits ; auth + owner/admin pour pièces permis |

### Favoris, avis, alertes stock (user)
| Méthode | Path | Description |
|---|---|---|
| GET / POST / DELETE | `/api/wishlist`, `/api/wishlist/:productId` | Gérer ses favoris |
| POST | `/api/products/:id/reviews` | Laisser un avis (achat vérifié requis) |
| POST | `/api/products/:id/stock-alerts` | S'inscrire à la notification de retour en stock |

### Admin — exports CSV
| Méthode | Path | Description |
|---|---|---|
| GET | `/api/admin/exports/orders.csv` | Toutes les commandes |
| GET | `/api/admin/exports/permits.csv` | Toutes les demandes de permis |
| GET | `/api/admin/exports/contest-registrations.csv` | Toutes les inscriptions concours |

### Concours (user)
| Méthode | Path | Description |
|---|---|---|
| POST | `/api/contests/:id/register` | S'inscrire |
| GET | `/api/contests-registrations/me` | Mes inscriptions |

### Carnet de prise (user)
| Méthode | Path | Description |
|---|---|---|
| GET | `/api/carnet` | Mes prises |
| POST | `/api/carnet` | Ajouter une prise |
| DELETE | `/api/carnet/:id` | Supprimer une prise |

### Admin (`ROLE_ADMIN` requis)
| Méthode | Path | Description |
|---|---|---|
| POST / PUT / DELETE | `/api/products`, `/api/products/:id` | CRUD produits |
| GET / PATCH | `/api/orders`, `/api/orders/:ref` | Commandes + changement de statut |
| GET / PATCH | `/api/permits`, `/api/permits/:ref` | Permis + approve/reject |
| GET | `/api/contests-registrations` | Toutes les inscriptions |
| POST / PUT / DELETE | `/api/contests`, `/api/contests/:id` | CRUD concours |

Toutes les routes protégées attendent un header `Authorization: Bearer <JWT>`.

## Schéma de la base de données

Tables principales (générées par Hibernate en `dbCreate: update`) :

- `users` — comptes clients/admin
- `products` — catalogue (+ champs `imageUrl`, `variants_json`, `specs_json`)
- `categories`, `techniques`, `species`, `contests` — référentiels métier
- `permit_types`, `departments` — grille tarifaire + départements éligibles
- `orders` + `order_items` — commandes et lignes
- `permits` — demandes de permis (+ `id_doc_url`, `photo_doc_url`)
- `contest_registrations` — inscriptions aux concours
- `catch_entries` — carnet de prise utilisateur

Le schéma complet peut être exporté avec :
```bash
docker exec hookcook-postgres-1 pg_dump -U hookcook --schema-only hookcook
```

## Modules fonctionnels (cahier des charges)

| # | Module | État |
|---|---|---|
| 1 | Gestion des produits (CRUD, catégories, stock) | ✅ |
| 2 | Boutique (navigation, panier, checkout) | ✅ (paiement mocké) |
| 3 | Clients (inscription, connexion, profil) | ✅ |
| 4 | Commandes (création, statut, historique) | ✅ |
| 5 | Permis (formulaire, upload pièces, workflow, timeline, notif email) | ✅ |
| 6 | Concours locaux (liste, inscription) | ✅ |
| 7 | Tableau de bord admin (produits, commandes, permis, concours, stats, exports CSV) | ✅ |

## Features au-delà du cahier

| Feature | Description |
|---|---|
| **Conditions live** | Home affiche le débit de la Têt (Hubeau), pression atmosphérique et phase lunaire en temps réel |
| **Carte des concours** | Leaflet + OSM France, pins custom, dark mode auto |
| **Carnet de prise** | Chaque user consigne ses prises (espèce, taille, spot, appât) |
| **Challenges mensuels** | Classement "plus grosse prise" par mois et par espèce |
| **Favoris** | Bouton cœur sur chaque produit, onglet dédié dans le compte |
| **Alerte retour en stock** | Notification email dès qu'un produit épuisé est réapprovisionné |
| **Avis clients vérifiés** | Avec agrégation automatique de la note moyenne sur le produit |
| **Cross-sell** | "Souvent acheté avec" basé sur les co-occurrences réelles |
| **Recherche fuzzy** | Tolérance aux fautes de frappe via Fuse.js |
| **Factures PDF** | Téléchargeables depuis la page de confirmation et le compte |
| **Export CSV admin** | Commandes, permis, inscriptions — format Excel FR compatible |
| **Mode sombre** | Toggle avec respect du `prefers-color-scheme` système |
| **Skeleton loaders** | Transitions fluides pendant les chargements |
| **Pages légales** | Mentions, CGV, confidentialité RGPD, cookies |

## Sécurité

- Mots de passe hashés **BCrypt 12 rounds** avant stockage, jamais renvoyés dans l'API.
- **JWT HS512** signé serveur, TTL 12h. En production, `HC_JWT_SECRET` doit faire ≥ 64 caractères sinon le backend refuse de démarrer.
- Admin seedé depuis `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) — plus de hash committé dans le SQL.
- **Rate limiting** : 5 tentatives / 10 min sur `/login`, 3 créations / heure sur `/register`.
- **Headers HTTP de sécurité** sur toutes les réponses nginx : X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy.
- **Uploads** : validation magic bytes (un `.php` renommé `.jpg` est rejeté), noms UUID 128 bits, accès aux pièces d'identité permis restreint au propriétaire + admin.
- **Containers Docker** en user non-root (uid 10001), Postgres bind sur localhost uniquement.
- **Actuator** restreint à `health` / `info` — plus de fuite de variables d'environnement.
- **Anti-IDOR** : messages d'erreur uniformes sur suppressions pour empêcher l'énumération d'IDs.
- **Références entités** (commandes, permis) : UUID dérivés au lieu de `Math.random()` — plus prédictible.
- CORS whitelist (pas de `*`), `allowCredentials: false` cohérent avec Bearer JWT.

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/hookcook` | URL JDBC Postgres |
| `DATASOURCE_USERNAME` | `hookcook` | User Postgres |
| `DATASOURCE_PASSWORD` | `hookcook` | Password Postgres |
| `HC_JWT_SECRET` | secret de dev (à changer en prod !) | Clé HMAC pour signer les JWT |
| `VITE_API_URL` | `http://localhost:8080` | URL API côté frontend (build-time) |
| `SMTP_HOST` | *(vide → logs seulement)* | Hôte SMTP (ex: `smtp.gmail.com`) |
| `SMTP_PORT` | `587` | Port SMTP |
| `SMTP_USERNAME` | — | Nom d'utilisateur SMTP |
| `SMTP_PASSWORD` | — | Mot de passe SMTP |
| `SMTP_FROM` | `no-reply@hookcook.fr` | Adresse expéditrice |
| `ADMIN_EMAIL` | `admin@hookcook.fr` | Email de l'admin seedé au boot |
| `ADMIN_PASSWORD` | `admin1234` | Mot de passe de l'admin seedé (à changer en prod !) |

Dès que `SMTP_HOST` est défini, `MailService` bascule automatiquement sur un vrai envoi via `JavaMailSender`. Sans SMTP configuré, les mails sont loggés dans la console Grails (utile pour le dev).

## Premier démarrage

```bash
cp .env.example .env
# édite .env et remplace tous les CHANGE_ME
# (générer des secrets forts avec :
#   python -c "import secrets; print(secrets.token_urlsafe(64))"
# )
docker compose up --build
```

Puis connecte-toi avec les credentials que tu as mis dans `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## Sécurité (Spring Security)

Le projet utilise **Spring Security** à deux endroits :
1. **`spring-security-crypto`** pour le hashing BCrypt des mots de passe utilisateurs (12 rounds).
2. **JWT manuel** (JJWT 0.12+) signé HS512 avec le secret serveur (`HC_JWT_SECRET`). Validation faite via un `AuthService` qui inspecte le header `Authorization: Bearer <token>` et vérifie le rôle (`ROLE_USER` / `ROLE_ADMIN`).

Le filtre complet Spring Security (`SecurityFilterChain`) n'est pas en place — la protection des endpoints admin se fait via `authService.isAdmin(request)` appelé dans chaque action admin. Fonctionnellement équivalent pour un projet de cette taille, sans la courbe d'apprentissage de la config Spring Security.

## Documentation

- [docs/API.md](docs/API.md) — documentation API exhaustive (tous endpoints + payloads + codes d'erreur)
- [docs/GUIDE-UTILISATEUR.md](docs/GUIDE-UTILISATEUR.md) — manuel client (compte, achat, permis, concours, carnet)
- [docs/GUIDE-ADMIN.md](docs/GUIDE-ADMIN.md) — manuel admin (produits, commandes, permis, concours, sécurité)
- [docs/cahier-des-charges.md](docs/cahier-des-charges.md) — spécifications fonctionnelles du projet

## Tests

Backend (Spock / Grails) :

```bash
cd backend
./grailsw test-app
# ou via Gradle directement :
./gradlew test
```

Tests fournis dans `backend/src/test/groovy/backend/` :
- `AuthServiceSpec` — register, login, BCrypt, validation
- `JwtServiceSpec` — issue + parse roundtrip, signature invalide, token malformé

## Scripts utiles

```bash
# Inspecter la BDD
docker exec -it hookcook-postgres-1 psql -U hookcook -d hookcook

# Compter les enregistrements
docker exec hookcook-postgres-1 psql -U hookcook -d hookcook -c "\
  SELECT 'products' t, count(*) FROM products UNION ALL \
  SELECT 'orders', count(*) FROM orders UNION ALL \
  SELECT 'permits', count(*) FROM permits;"

# Reset complet BDD
docker compose down -v && docker compose up -d postgres
```

## À venir

- Intégration Stripe/PayPal réelle (webhook + gestion succès/échec) — actuellement le paiement est simulé : la commande passe directement au statut `paid`
- Diagramme ERD formel de la base (exportable depuis `postgres/init/01-init.sql`)
- Tests d'intégration end-to-end (Playwright / Cypress)
- Internationalisation (i18n)
