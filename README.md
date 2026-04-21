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

Au premier boot, Postgres applique automatiquement [`postgres/init/01-init.sql`](postgres/init/01-init.sql) — tu récupères donc 12 produits (avec images), 4 concours, 6 catégories, 6 techniques, 8 espèces et le compte admin. Les images sont dans [`backend/uploads/`](backend/uploads) et copiées dans le volume au premier boot du backend.

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

Au premier démarrage, `BootStrap` injecte dans la BDD :
- 1 utilisateur admin
- 6 catégories, 6 techniques, 8 espèces, 4 concours, 12 produits

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
| GET | `/api/products` | Liste complète |
| GET | `/api/products/:id` | Détail |
| GET | `/api/categories`, `/api/techniques`, `/api/species` | Référentiels |
| GET | `/api/contests`, `/api/contests/:id` | Concours |

### Commandes (user)
| Méthode | Path | Description |
|---|---|---|
| POST | `/api/orders` | Créer une commande depuis le panier |
| GET | `/api/orders/me` | Mes commandes |
| GET | `/api/orders/:ref` | Détail (owner ou admin) |

### Permis (user)
| Méthode | Path | Description |
|---|---|---|
| POST | `/api/permits` | Soumettre une demande |
| GET | `/api/permits/me` | Ma demande en cours |

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
- `categories`, `techniques`, `species`, `contests` — référentiels
- `orders` + `order_items` — commandes et lignes
- `permits` — demandes de permis
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
| 5 | Permis (formulaire, workflow, timeline) | ✅ (notif email à brancher) |
| 6 | Concours locaux (liste, inscription) | ✅ |
| 7 | Tableau de bord admin | ✅ (produits, commandes, permis, concours) |

## Sécurité

- Mots de passe hashés BCrypt (coût 12) avant stockage.
- JWT HS512 signé avec un secret côté serveur, TTL 12h.
- Les endpoints admin vérifient le rôle via le claim + la BDD.
- CORS restreint aux origines localhost pour le dev (modifier `CorsConfig` en prod).
- Le secret JWT est surchargé en prod via la variable d'environnement `HC_JWT_SECRET`.

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

- [docs/GUIDE-UTILISATEUR.md](docs/GUIDE-UTILISATEUR.md) — manuel client (compte, achat, permis, concours, carnet)
- [docs/GUIDE-ADMIN.md](docs/GUIDE-ADMIN.md) — manuel admin (produits, commandes, permis, concours, sécurité)

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

- Intégration Stripe/PayPal réelle (webhook + gestion succès/échec)
- Notifications email (SendGrid / SMTP) sur validation de permis
- Tests unitaires et d'intégration
- Upload d'images produits (actuellement on colle une URL dans le form admin)
- Internationalisation
