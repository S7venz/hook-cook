# Guide administrateur — Hook & Cook

Guide d'utilisation du tableau de bord admin.

---

## Accéder à l'admin

1. Connectez-vous avec un compte **ROLE_ADMIN** (identifiants définis dans `.env` : `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
2. Naviguez vers `/admin` manuellement dans la barre d'URL
3. Le sidebar affiche 6 sections : Vue d'ensemble, **Statistiques**, Commandes, Permis, Concours, Produits

Si vous êtes connecté·e avec un compte utilisateur standard (ROLE_USER), vous êtes redirigé·e sur `/403` avec message explicite. Les endpoints backend renvoient systématiquement 403 sans le bon rôle.

## Vue d'ensemble

KPI affichés :
- **CA cumulé** — somme des totaux de toutes les commandes
- **Commandes à expédier** — nombre de commandes avec statut `paid`
- **Permis en attente** — nombre de permis avec statut `pending`
- **Inscriptions concours** — total cumulé des inscriptions

Panneau **Commandes récentes** — les 4 dernières commandes avec statut.

Panneau **Stock critique** — produits avec stock < seuil, clic *Réapprovisionner* mène à la section Produits.

## Statistiques (onglet dédié)

Depuis la v2, l'onglet **Statistiques** fournit un vrai tableau de bord métier :

### KPIs (première ligne)
- **CA total** — somme des totaux commandes
- **Panier moyen** — CA total / nombre de commandes payées+ (en €)
- **Taux de conversion** — % d'utilisateurs ayant acheté au moins une fois
- **Acheteurs uniques** — N acheteurs / total users inscrits

### KPIs (seconde ligne)
- **Commandes**, **Permis émis**, **Inscriptions concours**
- **Stocks critiques** — nombre de produits ≤ seuil (rouge si 0)

### Graphique CA par mois
Histogramme SVG natif sur 6 mois glissants. Chaque barre affiche le total mensuel.

### Breakdowns par statut
Deux colonnes : commandes par statut (paid/shipped/delivered/cancelled) et permis par statut (pending/approved/rejected).

### Top 5 produits vendus
Classement par quantité vendue (tous ordres inclus), avec CA généré.

### Stocks critiques & Jamais vendus
Deux panneaux côte-à-côte :
- **Stocks critiques** — jusqu'à 8 produits sous le seuil, triés par stock ascendant (rouge si 0, orange sinon)
- **Jamais vendus** — jusqu'à 6 produits qui n'apparaissent dans aucun `order_item`, triés par stock dormant décroissant

### CA par catégorie
Tableau des revenus agrégés par catégorie (cannes, leurres, etc.) avec la part % du CA total.

## Gestion des produits

### Ajouter un produit

1. Section **Produits** → bouton **+ Ajouter un produit**
2. Remplissez le formulaire :
   - **Identifiant (slug)** — obligatoire, ex : `hc-ma-nouvelle-canne`
   - **SKU** — référence interne (obligatoire)
   - **Nom, Catégorie** — obligatoires
   - **Technique, Marque** — optionnels
   - **Prix** (€) — obligatoire ≥ 0
   - **Prix barré** — optionnel (affiche un badge Promo si présent)
   - **Stock** — obligatoire ≥ 0
   - **Note / Nombre d'avis** — optionnels (recalculés automatiquement dès qu'un avis est publié)
   - **Type d'eau** — rivière, lac, mer…
   - **Espèces** — liste séparée par des virgules (ex : `truite, ombre, perche`)
   - **URL de la photo** — upload direct ou coller une URL. Un aperçu s'affiche sous le champ.
   - **Description**
3. Cliquez **Créer le produit**

### Modifier / Supprimer un produit

Comme avant — boutons sur chaque ligne.

Important : les produits déjà commandés restent référencés dans les commandes (snapshot au moment de la commande).

### Gestion du stock

Pour ajuster rapidement le stock :
- Éditez le produit, modifiez uniquement le champ Stock
- Ou utilisez le bouton **+10** sur la ligne pour incrémenter rapidement

**Nouveauté** : quand un produit passe de `stock = 0` à `stock > 0` via un replenish, tous les utilisateurs inscrits aux **alertes retour en stock** reçoivent automatiquement un email.

## Gestion des commandes

Section **Commandes** — tableau de toutes les commandes.

**Actions possibles selon le statut :**
- `paid` (payée) → clic **Marquer expédiée** → passe en `shipped`
- `shipped` (expédiée) → clic **Marquer livrée** → passe en `delivered`

Chaque changement met à jour le statut côté utilisateur (visible dans son compte).

**Bouton "Exporter en CSV"** dans l'en-tête de la section → télécharge toutes les commandes au format Excel FR compatible (BOM UTF-8 + séparateur `;`), fichier daté.

## Gestion des permis

Section **Permis** — toutes les demandes.

**Actions sur une demande en attente (`pending`) :**
- **Approuver** → statut passe en `approved`, email automatique au demandeur
- **Rejeter** → statut passe en `rejected`, email automatique

La timeline de l'utilisateur est mise à jour automatiquement avec la date de décision.

Colonne **Pièces** — liens cliquables vers la pièce d'identité et la photo uploadées. L'accès est sécurisé (uniquement admin ou propriétaire du permis, auth JWT requise, URLs UUID 128 bits).

**Bouton "Exporter en CSV"** disponible aussi sur cette section.

## Gestion des concours

### Ajouter un concours

Section **Concours** → **+ Ajouter un concours** → remplir :
- **Identifiant (slug)** — ex : `tet-2026-07`
- **Titre, Lieu** — obligatoires
- **Date ISO** — format `YYYY-MM-DD`
- **Date affichée** — format `JJ MOIS` (ex : `12 JUIL`)
- **Distance, Format, Prix, Inscrits, Places max**
- **Espèces** — slugs séparés par virgules
- **Règlement** — texte libre

### Modifier / supprimer

Boutons **Éditer** et **Supprimer** sur chaque ligne. La suppression efface également toutes les inscriptions au concours (décrémente les compteurs).

**Bouton "Exporter inscriptions CSV"** dans l'en-tête → télécharge toutes les inscriptions (concours, participant, catégorie, numéro de permis).

## Catégories / Techniques / Espèces / Types de permis / Départements

Gérés **uniquement via l'API backend** pour le moment (pas d'UI admin dédiée). Routes :

```
POST/PUT/DELETE  /api/categories[/:id]
POST/PUT/DELETE  /api/techniques[/:id]
POST/PUT/DELETE  /api/species[/:id]
GET              /api/permit-types     (public, lecture seule)
GET              /api/departments      (public, lecture seule)
```

Toutes protégées par `ROLE_ADMIN`. Les types de permis et départements sont seedés par `BootStrap.groovy` au démarrage.

## Seed de démonstration

Pour peupler l'environnement avec des données réalistes au premier boot :

```bash
# dans .env
HC_SEED_DEMO=true
```

Au démarrage du backend, `DemoSeedData.seedIfNeeded()` injecte (si `marie.dupont@demo.hookcook.fr` n'existe pas déjà) :

- **10 utilisateurs** français avec adresses 66/Occitanie (tous mot de passe `demo1234`)
- **18 commandes** étalées sur 6 mois (17 valides + 1 annulée)
- **6 permis** : 4 approved, 1 pending, 1 rejected
- **10 inscriptions** concours
- **8 avis clients** vérifiés
- **6 prises carnet** sur Têt/Tech/Vinça/Agly
- **7 favoris** distribués

Idempotent : si vous relancez avec `HC_SEED_DEMO=true`, rien n'est dupliqué.

Pour passer en mode propre (sans données de démo) :

```bash
# Arrêter, effacer les volumes, redémarrer avec HC_SEED_DEMO= vide
docker compose down -v
# puis éditer .env : HC_SEED_DEMO=
docker compose up -d
```

## Se déconnecter

Sidebar admin → **Se déconnecter** en bas.

## Raccourcis utiles

**Inspecter la BDD Postgres :**
```bash
docker exec -it hook-cook-postgres-1 psql -U hookcook -d hookcook
```

**Reset complet (efface tout — seed automatique au prochain boot) :**
```bash
bash scripts/reset.sh
```

**Dump de l'état courant (avant commit) :**
```bash
bash scripts/dump.sh
```

**Logs backend — emails :**
- Si `SMTP_HOST` est configuré dans `.env`, les mails sont envoyés pour de vrai
- Sinon, les notifications email (permis décision, confirmation commande, inscription concours, retour en stock, reset mot de passe) sont loggées dans le terminal Grails

## Sécurité en prod

Avant de déployer en production :

1. `HC_JWT_SECRET` ≥ 64 caractères dans `.env` (sinon le backend refuse de démarrer en profile `production`)
2. `ADMIN_EMAIL` / `ADMIN_PASSWORD` forts dans `.env` (sinon le backend refuse de démarrer)
3. CORS : adapter `backend/src/main/groovy/backend/config/CorsConfig.groovy` au domaine de prod
4. SMTP réel configuré pour les notifications (sinon elles restent en logs)
5. `HC_SEED_DEMO=` (vide) pour ne pas injecter les users fictifs
6. Docker Compose : Postgres est déjà bindé sur `127.0.0.1:5432` (safe)
7. Le backend container tourne en user non-root `app:10001`
8. Headers de sécurité HTTP déjà posés par nginx (CSP, X-Frame-Options, Referrer-Policy, etc.)
9. Rate limits actifs sur `/login` (5/10min) et `/register` (3/h)

Voir `README.md` section **Sécurité** pour le détail complet.
