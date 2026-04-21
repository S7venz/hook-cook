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

**Authentifié.** Crée une commande à partir du panier côté client. Envoie l'email de confirmation (`MailService.orderConfirmation`).

**Requête :**
```json
{
  "email": "alice@example.com",
  "address": { "line": "12 rue de la Têt", "postal": "66000", "city": "Perpignan" },
  "shippingMode": "Standard Colissimo",
  "shipping": 5.9,
  "items": [
    {
      "qty": 1,
      "product": {
        "id": "hc-sauvage-9-5",
        "name": "Canne...",
        "sku": "HC-C-095-6#4",
        "brand": "Hook & Cook",
        "imageUrl": "...",
        "price": 489.0
      }
    }
  ]
}
```

**Réponse `201` :** commande créée.

> ℹ️ Le paiement est pour l'instant **simulé** — la commande passe directement au statut `paid`.  
> Pour brancher une vraie passerelle (Stripe / PayPal), intercaler un webhook qui valide le paiement avant de basculer le statut.

**Erreurs :**
- `400` — panier vide ou données invalides

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
  "topProducts": [
    { "productId": "hc-sauvage-9-5", "name": "Canne...", "sku": "HC-C-095-6#4", "qty": 14, "revenue": 6846.0 }
  ],
  "ordersByStatus": { "paid": 18, "shipped": 6, "delivered": 22, "cancelled": 1 },
  "permitsByStatus": { "pending": 4, "approved": 32, "rejected": 2 },
  "totalRevenue": 18540.50,
  "totalOrders": 47,
  "totalPermits": 38,
  "totalRegistrations": 24
}
```

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

> Les colonnes `*_csv` (ex. `speciesCsv`, `monthsCsv`) stockent des listes sous forme de chaînes séparées par des virgules, et sont exposées comme tableaux dans les réponses JSON.  
> Les colonnes `*_json` (ex. `variantsJson`, `specsJson`, `historyJson`) stockent des objets/listes sérialisés et sont désérialisés dans `toApiMap()`.

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
