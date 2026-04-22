# Hook & Cook — Documentation API

API REST du backend Grails, consommée par le frontend React et par le tableau de bord administrateur.

---

## Sommaire

- [Généralités](#généralités)
- [Authentification](#1-authentification)
- [Produits](#2-produits)
- [Données de référence](#3-données-de-référence)
- [Commandes](#4-commandes)
- [Permis de pêche](#5-permis-de-pêche)
- [Concours et inscriptions](#6-concours-et-inscriptions)
- [Carnet de prises](#7-carnet-de-prises)
- [Uploads de fichiers](#8-uploads-de-fichiers)
- [Statistiques admin](#9-statistiques-admin)
- [Avis produits](#10-avis-produits)
- [Favoris (wishlist)](#11-favoris-wishlist)
- [Alertes retour en stock](#12-alertes-retour-en-stock)
- [Leaderboard mensuel](#13-leaderboard-mensuel)
- [Exports CSV admin](#14-exports-csv-admin)
- [RGPD (export et suppression)](#15-rgpd)
- [Password reset](#16-password-reset)
- [Paiements Stripe](#17-paiements-stripe)
- [Modèle de données](#modèle-de-données)
- [Codes de statut HTTP](#codes-de-statut-http)

---

## Généralités

### Base URL

| Environnement | URL |
|---|---|
| Développement local | `http://localhost:8080` |
| Docker Compose | `http://localhost:8080` |

Tous les endpoints sont préfixés par `/api/`.

### Formats

- **Requêtes** : `Content-Type: application/json` (sauf upload multipart — voir §8)
- **Réponses** : `application/json` systématiquement
- **Encodage** : UTF-8
- **Dates** : ISO 8601 (`2026-04-21T10:15:00Z`) pour les timestamps, `YYYY-MM-DD` pour les dates simples

### Authentification

L'API utilise un **JWT (HS512)** transmis dans le header HTTP :

```
Authorization: Bearer <token>
```

Le token est obtenu via `POST /api/auth/login` ou `POST /api/auth/register`. Il contient :
- `sub` : identifiant utilisateur (Long)
- `role` : `ROLE_USER` ou `ROLE_ADMIN`
- `exp` : expiration (7 jours par défaut)

Les mots de passe sont hashés côté backend avec **BCrypt** (facteur de coût 12).

### Rôles

| Rôle | Description |
|---|---|
| `ROLE_USER` | Client inscrit — accès à ses propres données (commandes, permis, carnet) |
| `ROLE_ADMIN` | Administrateur — accès à toutes les données + actions de gestion |

### Format d'erreur

Toutes les erreurs renvoient un JSON de la forme :

```json
{ "error": "Message lisible en français" }
```

---

## 1. Authentification

### 1.1 — Inscription

```
POST /api/auth/register
```

**Public.** Crée un compte `ROLE_USER` et renvoie un token JWT.

**Requête :**
```json
{
  "email": "alice@example.com",
  "password": "motdepasse123",
  "firstName": "Alice",
  "lastName": "Martin"
}
```

**Réponse `201` :**
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

**Erreurs :**
- `400` — champs manquants, email invalide, mot de passe < 8 caractères, email déjà utilisé

---

### 1.2 — Connexion

```
POST /api/auth/login
```

**Public.** Valide les identifiants et renvoie un token JWT.

**Requête :**
```json
{ "email": "alice@example.com", "password": "motdepasse123" }
```

**Réponse `200` :** identique à `register`.

**Erreurs :**
- `401` — email ou mot de passe incorrect

---

### 1.3 — Profil courant

```
GET /api/auth/me
```

**Authentifié.** Renvoie les informations du compte lié au token.

**Réponse `200` :**
```json
{ "user": { "id": 42, "email": "...", ... } }
```

**Erreurs :**
- `401` — token manquant ou invalide

---

### 1.4 — Mise à jour du profil

```
PATCH /api/auth/me
```

**Authentifié.** Met à jour partiellement les champs modifiables.

**Requête (tous les champs sont optionnels) :**
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

**Réponse `200` :** `{ "user": { ... } }`

---

## 2. Produits

### 2.1 — Liste des produits

```
GET /api/products
```

**Public.** Retourne tous les produits triés par nom.

**Réponse `200` :**
```json
[
  {
    "id": "hc-sauvage-9-5",
    "sku": "HC-C-095-6#4",
    "name": "Canne Hook & Cook Sauvage 9'5\" #6",
    "category": "cannes",
    "technique": "mouche",
    "price": 489.0,
    "wasPrice": null,
    "stock": 12,
    "rating": 4.8,
    "reviews": 34,
    "brand": "Hook & Cook",
    "water": "rivière",
    "img": null,
    "imageUrl": "http://localhost:8080/api/uploads/canne-95.jpg",
    "description": "Blank carbone haut module...",
    "lowStockThreshold": 15,
    "story": "Assemblée à Prades...",
    "species": ["truite", "ombre"],
    "months": [3, 4, 5, 6, 7, 8, 9],
    "variants": { "longueur": ["9'", "9'5\"", "10'"] },
    "specs": { "poids": "98 g", "sections": 4 }
  }
]
```

### 2.2 — Détail produit

```
GET /api/products/{id}
```

**Public.** `{id}` = slug du produit (ex : `hc-sauvage-9-5`).

**Erreurs :** `404` — produit introuvable.

### 2.3 — Créer un produit

```
POST /api/products
```

**Admin.** Champs obligatoires : `id`, `sku`, `name`, `category`.

**Requête :** même structure que la réponse de §2.1.

**Réponse `201` :** produit créé (`toApiMap`).

**Erreurs :**
- `400` — champs requis manquants ou validation échouée
- `409` — un produit existe déjà avec cet `id`
- `403` — utilisateur non admin

### 2.4 — Mettre à jour un produit

```
PUT /api/products/{id}
```

**Admin.** Tous les champs sont optionnels (mise à jour partielle). L'`id` ne peut pas être modifié.

### 2.5 — Supprimer un produit

```
DELETE /api/products/{id}
```

**Admin.** Réponse `204 No Content`.

### 2.6 — Réapprovisionner le stock

```
POST /api/products/{id}/replenish
```

**Admin.** Ajoute `qty` au stock actuel.

**Requête :**
```json
{ "qty": 10 }
```

**Erreurs :**
- `400` — `qty` ≤ 0

---

## 3. Données de référence

Catégories, techniques, espèces et concours — utilisés pour alimenter les filtres de la boutique et l'UI.

### 3.1 — Catégories

| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | Liste triée par nom |
| `POST` | `/api/categories` | Admin | Créer. Corps : `{ id, name, count }` |
| `PUT` | `/api/categories/{id}` | Admin | Modifier |
| `DELETE` | `/api/categories/{id}` | Admin | Supprimer |

**Structure :** `{ id, name, count }` — `count` = nombre indicatif affiché sur le filtre.

### 3.2 — Techniques

| Méthode | Endpoint | Rôle |
|---|---|---|
| `GET` | `/api/techniques` | Public |
| `POST` | `/api/techniques` | Admin |
| `PUT` | `/api/techniques/{id}` | Admin |
| `DELETE` | `/api/techniques/{id}` | Admin |

**Structure :** `{ id, name }`

### 3.3 — Espèces

| Méthode | Endpoint | Rôle |
|---|---|---|
| `GET` | `/api/species` | Public |
| `POST` | `/api/species` | Admin |
| `PUT` | `/api/species/{id}` | Admin |
| `DELETE` | `/api/species/{id}` | Admin |

**Structure :**
```json
{
  "id": "truite",
  "name": "Truite fario",
  "latin": "Salmo trutta fario",
  "water": "rivière",
  "imageUrl": "http://localhost:8080/api/uploads/species-truite.webp",
  "months": [3, 4, 5, 6, 7, 8, 9]
}
```

### 3.4 — Concours

| Méthode | Endpoint | Rôle |
|---|---|---|
| `GET` | `/api/contests` | Public — liste triée par date |
| `GET` | `/api/contests/{id}` | Public — détail |
| `POST` | `/api/contests` | Admin |
| `PUT` | `/api/contests/{id}` | Admin |
| `DELETE` | `/api/contests/{id}` | Admin — supprime aussi les inscriptions liées |

**Structure :**
```json
{
  "id": "vesoul-2026-05",
  "title": "Open de la Têt — Truite fario",
  "date": "2026-05-04",
  "dateDisplay": "04 MAI",
  "lieu": "Vallée de la Têt — Olette (66)",
  "distance": "38 km",
  "format": "No-kill · individuel",
  "prix": 25.0,
  "inscrits": 18,
  "max": 40,
  "reglement": "Pêche à la mouche...",
  "species": ["truite"]
}
```

> ⚠️ Champs requis à la création : `id`, `title`, `date`, `dateDisplay`, `lieu`.

### 3.5 — Types de permis

```
GET /api/permit-types
```

**Public.** Retourne la grille tarifaire des permis (persistée en BDD, table `permit_types`).

**Réponse `200` :**
```json
[
  {
    "id": "decouverte",
    "title": "Découverte",
    "label": "-12 ans",
    "price": 6.00,
    "items": ["Mineurs jusqu'à 12 ans", "Toute l'année", "Carte gratuite -2 ans"]
  },
  {
    "id": "semaine",
    "title": "Permis semaine",
    "label": "Vacances",
    "price": 28.00,
    "items": ["7 jours consécutifs", "Carte interfédérale", "Idéal séjour"]
  },
  {
    "id": "annuel",
    "title": "Permis annuel",
    "label": "Le plus choisi",
    "price": 92.00,
    "items": ["Valide du 1er janv. au 31 déc.", "Toutes eaux 1re et 2e catégorie", "CPMA incluse"]
  }
]
```

### 3.6 — Départements

```
GET /api/departments
```

**Public.** Retourne les départements éligibles à une demande de permis (table `departments`).

**Réponse `200` :**
```json
[
  { "code": "09", "name": "09 — Ariège" },
  { "code": "11", "name": "11 — Aude" },
  { "code": "34", "name": "34 — Hérault" },
  { "code": "66", "name": "66 — Pyrénées-Orientales" }
]
```

---

## 4. Commandes

### 4.1 — Mes commandes

```
GET /api/orders/me
```

**Authentifié.** Retourne les commandes de l'utilisateur courant, triées par date décroissante.

**Réponse `200` :**
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
    "statusLabel": "Payée",
    "shippingMode": "Standard Colissimo",
    "address": { "line": "12 rue de la Têt", "postal": "66000", "city": "Perpignan" },
    "items": [
      {
        "productId": "hc-sauvage-9-5",
        "productName": "Canne Hook & Cook Sauvage 9'5\" #6",
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

### 4.2 — Créer une commande

```
POST /api/orders
```

**Authentifié.** Crée une commande à partir du panier côté client. Vérifie le stock côté serveur, recalcule le total à partir du prix BDD (jamais confiance au montant client) et :

- **Mode Stripe** (`STRIPE_SECRET_KEY` défini) : crée un PaymentIntent Stripe, statut initial `pending`. Le passage à `paid` + décrémentation stock + email de confirmation se font dans le webhook `payment_intent.succeeded` (cf. §17).
- **Mode mock** (CI / démo sans clé) : statut directement `paid`, stock décrémenté, email envoyé.

**Requête :** seuls `id` et `qty` du produit sont nécessaires (le backend hydrate le reste depuis la BDD).
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

**Réponse `201` (mode Stripe) :**
```json
{
  "order": {
    "id": "HC-2186-4829",
    "status": "pending",
    "statusLabel": "En attente de paiement",
    "stripePaymentIntentId": "pi_3OXxXxxxxxxxxxxx",
    "total": 494.9,
    "items": [/* … */]
  },
  "clientSecret": "pi_3OXxXxxxxxxxxxxx_secret_xxxxxxxx",
  "publishableKey": "pk_test_xxxxxxxxxxxx"
}
```

**Réponse `201` (mode mock) :**
```json
{
  "order": { "id": "HC-2186-4829", "status": "paid", /* … */ },
  "mockPayment": true
}
```

**Erreurs :**
- `400` — panier vide, produit introuvable, stock insuffisant, ou échec d'init Stripe

### 4.3 — Détail d'une commande

```
GET /api/orders/{reference}
```

**Authentifié.** L'utilisateur ne peut voir que ses propres commandes ; les admins voient toutes les commandes.

**Erreurs :**
- `403` — commande d'un autre utilisateur
- `404` — commande introuvable

### 4.4 — Liste de toutes les commandes (admin)

```
GET /api/orders
```

**Admin.** Liste complète, triée par date décroissante.

### 4.5 — Changer le statut

```
PATCH /api/orders/{reference}
```

**Admin.**

**Requête :**
```json
{ "status": "shipped" }
```

**Valeurs autorisées :** `paid`, `shipped`, `delivered`, `cancelled`.

> ⚠️ Les statuts `pending` et `payment_failed` sont gérés exclusivement par le webhook Stripe — refusés ici.

---

## 5. Permis de pêche

### 5.1 — Mon permis en cours

```
GET /api/permits/me
```

**Authentifié.** Retourne le permis le plus récent de l'utilisateur, ou `{ "permit": null }` s'il n'en a aucun.

### 5.2 — Créer une demande

```
POST /api/permits
```

**Authentifié.**

**Requête :**
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

- `typeId` doit correspondre à un `id` renvoyé par [§3.5](#35--types-de-permis).
- `department` accepte soit le code (`"66"`), soit le nom complet (`"66 — Pyrénées-Orientales"`).
- `idDocUrl` et `photoDocUrl` sont obtenus au préalable via [§8](#8-uploads-de-fichiers).

**Réponse `201` :**
```json
{
  "id": "FR-2026-48291",
  "typeId": "annuel",
  "typeTitle": "Permis annuel",
  "amount": 92.0,
  "department": "66 — Pyrénées-Orientales",
  "firstName": "Alice",
  "lastName": "Martin",
  "birthDate": "1990-05-12",
  "status": "pending",
  "statusLabel": "En instruction",
  "submittedAt": "2026-04-21T10:15:00Z",
  "idDocUrl": "http://localhost:8080/api/uploads/1745234567890-a1b2c3d4.jpg",
  "photoDocUrl": "http://localhost:8080/api/uploads/1745234598123-ef567890.jpg",
  "history": [
    { "label": "Demande envoyée", "date": "21/04/2026 12:15", "done": true },
    { "label": "Paiement confirmé", "date": "21/04/2026 12:18", "done": true },
    { "label": "En instruction (fédération)", "date": "21/04/2026 13:15", "done": true, "current": true },
    { "label": "Décision", "date": null, "done": false }
  ]
}
```

### 5.3 — Liste de tous les permis (admin)

```
GET /api/permits
```

**Admin.** Chaque ligne inclut un `userEmail` pour l'affichage dashboard.

### 5.4 — Approuver ou rejeter

```
PATCH /api/permits/{reference}
```

**Admin.** Envoie l'email de décision au demandeur (`MailService.permitDecision`).

**Requête :**
```json
{ "status": "approved" }
```

**Valeurs autorisées :** `approved`, `rejected`.

---

## 6. Concours et inscriptions

### 6.1 — S'inscrire à un concours

```
POST /api/contests/{id}/register
```

**Authentifié.** Incrémente `contest.inscrits` et envoie l'email de confirmation.

**Requête :**
```json
{
  "category": "hommes-am",
  "permitNumber": "FR-2026-48291"
}
```

**Catégories autorisées :** `hommes-exp`, `hommes-am`, `femmes`, `jeunes`.

**Réponse `201` :**
```json
{
  "id": 17,
  "contestId": "vesoul-2026-05",
  "contestTitle": "Open de la Têt — Truite fario",
  "contestDate": "04 MAI",
  "category": "hommes-am",
  "permitNumber": "FR-2026-48291",
  "submittedAt": "2026-04-21T10:30:00Z"
}
```

**Erreurs :**
- `400` — concours introuvable ou utilisateur déjà inscrit

### 6.2 — Mes inscriptions

```
GET /api/contests-registrations/me
```

**Authentifié.**

### 6.3 — Toutes les inscriptions (admin)

```
GET /api/contests-registrations
```

**Admin.** Chaque ligne inclut `userEmail`.

---

## 7. Carnet de prises

Fonctionnalité bonus permettant au pêcheur de consigner ses prises.

### 7.1 — Lister mes prises

```
GET /api/carnet
```

**Authentifié.**

**Réponse `200` :**
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
    "weather": "Couvert, 12°C",
    "photo": "IMG_4281"
  }
]
```

### 7.2 — Enregistrer une prise

```
POST /api/carnet
```

**Authentifié.**

**Requête :**
```json
{
  "date": "2026-04-18",
  "species": "truite",
  "taille": 34,
  "poids": 420,
  "spot": "La Têt — Olette",
  "bait": "Sedge olive #14",
  "weather": "Couvert, 12°C",
  "photo": "IMG_4281"
}
```

### 7.3 — Supprimer une prise

```
DELETE /api/carnet/{id}
```

**Authentifié.** L'utilisateur ne peut supprimer que ses propres prises.

---

## 8. Uploads de fichiers

### 8.1 — Uploader un fichier

```
POST /api/uploads
```

**Authentifié** (tout utilisateur connecté — utilisé à la fois par l'admin pour les images produits, et par les clients pour les pièces justificatives du permis).

Requête **multipart/form-data** (pas JSON).

**Champs :**
| Champ | Type | Description |
|---|---|---|
| `file` | File | Image à uploader |

**Contraintes :**
- Extensions autorisées : `jpg`, `jpeg`, `png`, `webp`, `gif`, `avif`
- Taille max : **8 Mo** (retour `413` au-delà)

**Réponse `201` :**
```json
{
  "url": "http://localhost:8080/api/uploads/1745234567890-a1b2c3d4.jpg",
  "filename": "1745234567890-a1b2c3d4.jpg",
  "size": 412890
}
```

**Erreurs :**
- `400` — aucun fichier reçu
- `413` — fichier trop lourd
- `415` — extension non supportée

### 8.2 — Servir un fichier

```
GET /api/uploads/{filename}
```

**Public.** Cache HTTP 1 an (`Cache-Control: public, max-age=31536000`).

**Erreurs :**
- `400` — nom de fichier invalide (contient `/` ou `..`)
- `404` — fichier introuvable

---

## 9. Statistiques admin

### 9.1 — Vue d'ensemble

```
GET /api/admin/stats
```

**Admin.** Agrégats pour le dashboard.

**Réponse `200` :**
```json
{
  "revenueByMonth": [
    { "key": "2025-11", "label": "nov. 2025", "total": 2480.50, "count": 9 },
    { "key": "2025-12", "label": "déc. 2025", "total": 3120.00, "count": 12 }
  ],
  "newUsersByMonth": [
    { "key": "2026-04", "label": "avr. 2026", "count": 3 }
  ],
  "topProducts": [
    { "productId": "hc-sauvage-9-5", "name": "Canne...", "sku": "HC-C-095-6#4", "qty": 14, "revenue": 6846.0 }
  ],
  "ordersByStatus": { "paid": 18, "shipped": 6, "delivered": 22, "cancelled": 1 },
  "permitsByStatus": { "pending": 4, "approved": 32, "rejected": 2 },
  "categoryRevenue": [
    { "category": "cannes", "revenue": 4500.00 },
    { "category": "leurres", "revenue": 320.00 }
  ],
  "lowStock": [
    { "id": "hc-x", "name": "Canne X", "stock": 2, "threshold": 15, "category": "cannes" }
  ],
  "neverSold": [
    { "id": "hc-y", "name": "Accessoire Y", "stock": 30, "price": 12.50, "category": "accessoires" }
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

Champs :
- **`avgBasket`** : CA total / nombre de commandes payées+ (panier moyen).
- **`conversionRate`** : % d'utilisateurs ayant acheté au moins une fois (proxy simple).
- **`lowStock`** : 8 produits avec stock ≤ seuil, triés par stock asc.
- **`neverSold`** : 6 produits jamais apparus dans un `order_item`, triés par stock dormant desc.
- **`categoryRevenue`** : CA agrégé par catégorie, trié desc.

---

## 10. Avis produits

### 10.1 — Lister les avis d'un produit

```
GET /api/products/{id}/reviews
```

**Public.** Trié par date décroissante.

**Réponse `200` :**
```json
[
  {
    "id": 42,
    "productId": "hc-sauvage-9-5",
    "rating": 5,
    "title": "Parfaite en rivière",
    "comment": "Action moyenne-rapide, lancers doux...",
    "verifiedPurchase": true,
    "author": { "firstName": "Marie", "lastName": "D." },
    "createdAt": "2026-04-15T10:12:00Z"
  }
]
```

### 10.2 — Vérifier l'éligibilité

```
GET /api/products/{id}/reviews/eligibility
```

**Authentifié.** Indique si le user peut laisser un avis.

**Réponse `200` :**
```json
{ "eligible": true }
```

ou :
```json
{ "eligible": false, "reason": "not_purchased" }
```

Raisons possibles : `not_logged_in`, `not_purchased`, `already_reviewed`.

### 10.3 — Publier un avis

```
POST /api/products/{id}/reviews
```

**Authentifié.** L'utilisateur doit avoir acheté le produit (commande en statut `paid`, `shipped` ou `delivered`) et ne pas avoir déjà laissé un avis.

**Requête :**
```json
{ "rating": 5, "title": "Optionnel", "comment": "Minimum 10 caractères" }
```

**Erreurs :**
- `400` — note hors 1..5, commentaire trop court, pas d'achat, déjà commenté

### 10.4 — Supprimer un avis

```
DELETE /api/reviews/{id}
```

**Authentifié.** L'utilisateur ne peut supprimer que ses propres avis (admin peut tout).

---

## 11. Favoris (wishlist)

### 11.1 — Mes favoris

```
GET /api/wishlist
```

**Authentifié.**

### 11.2 — Ajouter aux favoris

```
POST /api/wishlist
```

**Authentifié.** Idempotent — re-ajouter un produit déjà favori renvoie `200` au lieu de `409`.

**Requête :**
```json
{ "productId": "hc-sauvage-9-5" }
```

### 11.3 — Retirer des favoris

```
DELETE /api/wishlist/{productId}
```

**Authentifié.** Idempotent aussi — `204` même si le produit n'est pas dans les favoris.

---

## 12. Alertes retour en stock

### 12.1 — S'inscrire à une alerte

```
POST /api/products/{id}/stock-alerts
```

**Authentifié.** Le produit doit être à **stock = 0**. Quand l'admin réapprovisionne (transition `0 → >0`), un email est envoyé automatiquement.

**Erreurs :**
- `400` — produit déjà en stock, produit introuvable

### 12.2 — Mes alertes

```
GET /api/stock-alerts
```

**Authentifié.** Liste avec flag `notified` et `notifiedAt`.

---

## 13. Leaderboard mensuel

### 13.1 — Classement d'un mois

```
GET /api/leaderboard/monthly?year=2026&month=4&species=truite&limit=10
```

**Public.** Tous params optionnels (défaut : mois courant, toutes espèces, limit 10). Classe les prises du carnet par taille décroissante puis poids puis date d'inscription.

**Réponse `200` :**
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

### 13.2 — Résumé mois courant

```
GET /api/leaderboard/summary
```

**Public.** Top 5 global + tops par espèce phare (truite, carpe, brochet).

---

## 14. Exports CSV admin

Tous les endpoints renvoient un fichier CSV avec BOM UTF-8 + séparateur `;` (format Excel FR compatible).

| Méthode | Endpoint | Contenu |
|---|---|---|
| GET | `/api/admin/exports/orders.csv` | Toutes les commandes |
| GET | `/api/admin/exports/permits.csv` | Toutes les demandes de permis |
| GET | `/api/admin/exports/contest-registrations.csv` | Toutes les inscriptions concours |

**Admin uniquement.** Nom de fichier daté : `hook-cook-commandes-YYYY-MM-DD.csv`.

---

## 15. RGPD

Couvre les articles 15, 17 et 20 du règlement. Accessibles depuis `/compte` → Paramètres.

### 15.1 — Export de mes données

```
GET /api/users/me/export
```

**Authentifié.** Renvoie un JSON pretty-printed téléchargeable contenant le profil + toutes les entités rattachées : commandes, permis, inscriptions concours, carnet, favoris, avis, alertes stock.

**Content-Type** : `application/json; charset=UTF-8`
**Content-Disposition** : `attachment; filename="hook-cook-export-{userId}-{YYYY-MM-DD}.json"`

### 15.2 — Supprimer mon compte

```
DELETE /api/users/me
```

**Authentifié.** **Irréversible.** Le compte est anonymisé plutôt que supprimé :

- Email → `anonyme-{id}@deleted.local`
- Prénom/nom/téléphone/adresse → vidés
- Hash BCrypt → invalidé (plus aucune reconnexion possible)
- Wishlist, alertes stock, carnet, avis, inscriptions concours → **supprimés**
- Permis → conservés mais anonymisés (nom, prénom, birthDate, doc URLs)
- Commandes → conservées 10 ans (obligation fiscale) mais détachées de l'identité

**Erreurs :**
- `400` — impossible d'anonymiser un compte `ROLE_ADMIN`

**Réponse `200` :**
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

Flow de réinitialisation du mot de passe par email. Aucune divulgation de l'existence d'un compte — toutes les réponses sont identiques quel que soit l'email.

### 16.1 — Demander un lien

```
POST /api/auth/password-reset/request
```

**Public.** Rate limité à **3 demandes / heure / email**.

**Requête :**
```json
{ "email": "user@example.fr" }
```

**Réponse `200` (toujours, même si l'email est inconnu) :**
```json
{
  "ok": true,
  "message": "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
}
```

Un email contenant le lien `{baseUrl}/reset-password/{token}` est envoyé si l'email existe. Le token est un UUID 128 bits, valable 1h, à usage unique. Tous les tokens précédents non utilisés du user sont invalidés à chaque nouvelle demande.

### 16.2 — Confirmer le reset

```
POST /api/auth/password-reset/confirm
```

**Public.** Valide le token et pose le nouveau mot de passe.

**Requête :**
```json
{ "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", "password": "nouveau-mdp" }
```

**Erreurs :**
- `400` — token manquant, token invalide/expiré/déjà utilisé, mot de passe < 8 chars

**Réponse `200` :**
```json
{ "ok": true, "email": "user@example.fr" }
```

Le hash BCrypt du user est mis à jour, le token est marqué `used=true` avec `usedAt` timestamp.

---

## 17. Paiements Stripe

### 17.1 — Webhook Stripe

```
POST /api/payments/webhook
```

**Public** (pas de JWT). La sécurité repose sur la **vérification HMAC** de l'header `Stripe-Signature` via le secret `STRIPE_WEBHOOK_SECRET`.

Events traités :

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Marque la commande `paid`, décrémente le stock, envoie l'email de confirmation. Idempotent (rejouable sans effet de bord). |
| `payment_intent.payment_failed` | Marque la commande `payment_failed`, ne touche pas au stock. |
| autres | Ignoré (réponse `200` pour confirmer la réception à Stripe). |

**Réponse `200` :**
```json
{ "received": true }
```

**Erreurs :**
- `400` — signature manquante ou invalide
- `503` — `STRIPE_WEBHOOK_SECRET` non configuré (refus de traiter)

### 17.2 — Mode test local

Pour relayer les webhooks de Stripe vers `localhost:8080` :

```bash
stripe listen --forward-to localhost:8080/api/payments/webhook
```

La CLI affiche le `whsec_...` à mettre dans `.env` sous `STRIPE_WEBHOOK_SECRET`.

**Cartes de test** (date future quelconque, CVC 3 chiffres) :
- `4242 4242 4242 4242` — succès
- `4000 0000 0000 9995` — refus (fonds insuffisants)
- `4000 0027 6000 3184` — déclenche 3D Secure

### 17.3 — Variables d'environnement

| Var | Description | Obligatoire |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` | Pour activer Stripe (sinon : mode mock) |
| `STRIPE_PUBLIC_KEY` | `pk_test_...` ou `pk_live_...` | Renvoyée au front à la création de commande |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Pour valider les webhooks |
| `STRIPE_CURRENCY` | code ISO (défaut: `eur`) | Non |
| `VITE_STRIPE_PUBLIC_KEY` | clé publique exposée au navigateur | Build front |

---

## Modèle de données

Vue synthétique des entités persistées (voir `postgres/init/01-init.sql` pour le schéma DDL complet).

| Table | Description | Relations |
|---|---|---|
| `users` | Comptes clients et admins | 1..N `orders`, `permits`, `contest_registrations`, `catch_entries` |
| `products` | Catalogue de vente | — |
| `categories` | Catégories de produits (référentiel) | — |
| `techniques` | Techniques de pêche (référentiel) | — |
| `species` | Espèces cibles (référentiel) | — |
| `permit_types` | Grille tarifaire des permis (référentiel) | — |
| `departments` | Départements éligibles (référentiel) | — |
| `orders` | Commandes clients | 1..N `order_items`, N..1 `users` |
| `order_items` | Lignes de commande (snapshot produit) | N..1 `orders` |
| `permits` | Demandes de permis | N..1 `users` |
| `contests` | Concours organisés | 1..N `contest_registrations` |
| `contest_registrations` | Inscriptions aux concours | N..1 `users`, N..1 `contests` |
| `catch_entries` | Carnet de prises | N..1 `users` |
| `product_reviews` | Avis clients vérifiés | N..1 `users`, N..1 `products` (via `productId` slug) |
| `wishlist_items` | Favoris | N..1 `users`, ref `productId` |
| `stock_alerts` | Demandes de notification retour stock | N..1 `users`, ref `productId`, flag `notified` |
| `password_reset_tokens` | Tokens one-shot pour reset mot de passe | N..1 `users`, TTL 1h |

> Les colonnes `*_csv` (ex. `speciesCsv`, `monthsCsv`) stockent des listes sous forme de chaînes séparées par des virgules, et sont exposées comme tableaux dans les réponses JSON.  
> Les colonnes `*_json` (ex. `variantsJson`, `specsJson`, `historyJson`, `itemsJson`) stockent des objets/listes sérialisés et sont désérialisés dans `toApiMap()`.

---

## Codes de statut HTTP

| Code | Signification |
|---|---|
| `200` | Succès (GET, PATCH, PUT) |
| `201` | Ressource créée (POST) |
| `204` | Succès sans contenu (DELETE) |
| `400` | Données invalides, validation échouée |
| `401` | Token manquant, invalide ou expiré |
| `403` | Droits insuffisants (pas admin, commande d'un autre user…) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex : `id` déjà utilisé à la création) |
| `413` | Upload trop lourd |
| `415` | Type de fichier non supporté |
| `500` | Erreur serveur |

---

## Exemples d'intégration

### cURL — Workflow complet client

```bash
# 1. Inscription
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"motdepasse123","firstName":"Alice","lastName":"Martin"}'

# 2. Récupérer le token retourné, puis demander un permis
TOKEN="eyJhbGc..."
curl -X POST http://localhost:8080/api/permits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"typeId":"annuel","firstName":"Alice","lastName":"Martin","birthDate":"1990-05-12"}'

# 3. Lister les concours
curl http://localhost:8080/api/contests

# 4. S'inscrire à un concours
curl -X POST http://localhost:8080/api/contests/vesoul-2026-05/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"femmes","permitNumber":"FR-2026-48291"}'
```

### JavaScript — Appel type (frontend React)

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

## Historique

| Version | Date | Changements |
|---|---|---|
| 1.0 | 2026-04-21 | Version initiale — couvre les 6 modules du cahier des charges |
