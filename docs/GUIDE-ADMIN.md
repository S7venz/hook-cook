# Guide administrateur — Hook & Cook

Guide d'utilisation du tableau de bord admin.

---

## Accéder à l'admin

1. Connectez-vous avec un compte **ROLE_ADMIN** (par défaut : `admin@hookcook.fr` / `admin1234`)
2. Naviguez vers `/admin` manuellement dans la barre d'URL
3. Le sidebar affiche 5 sections : Vue d'ensemble, Commandes, Permis, Concours, Produits

Si vous êtes connecté·e avec un compte utilisateur standard (ROLE_USER), vous verrez une page **"Accès réservé aux administrateurs"** et les endpoints backend vous renverront 403.

## Vue d'ensemble

KPI affichés :
- **CA cumulé** — somme des totaux de toutes les commandes
- **Commandes à expédier** — nombre de commandes avec statut `paid`
- **Permis en attente** — nombre de permis avec statut `pending`
- **Inscriptions concours** — total cumulé des inscriptions

Panneau "Commandes récentes" — les 4 dernières commandes avec statut.

Panneau "Stock critique" — produits avec stock < 15, clic réapprovisionner mène à la section Produits.

## Gestion des produits

### Ajouter un produit

1. Section **Produits** → bouton **+ Ajouter un produit**
2. Remplissez le formulaire :
   - **Identifiant (slug)** — obligatoire, ex: `hc-ma-nouvelle-canne`
   - **SKU** — référence interne (obligatoire)
   - **Nom, Catégorie** — obligatoires
   - **Technique, Marque** — optionnels
   - **Prix** (€) — obligatoire ≥ 0
   - **Prix barré** — optionnel (affiche un badge Promo si présent)
   - **Stock** — obligatoire ≥ 0
   - **Note / Nombre d'avis** — optionnels
   - **Type d'eau** — rivière, lac, mer…
   - **Espèces** — liste séparée par des virgules (ex: `truite, ombre, perche`)
   - **URL de la photo** — collez une URL d'image (Unsplash, Pexels, CDN). Un aperçu s'affiche sous le champ.
   - **Étiquette placeholder** — texte affiché si pas d'URL
   - **Description**
3. Cliquez **Créer le produit**

### Modifier un produit

1. Ligne du produit → **Éditer**
2. Le formulaire s'ouvre pré-rempli (l'identifiant n'est plus modifiable)
3. Ajustez les champs, cliquez **Enregistrer les modifications**

### Supprimer un produit

Bouton **Supprimer** sur la ligne → confirmation navigateur → DELETE backend.

**Attention** : les produits déjà commandés restent référencés dans les commandes (snapshot au moment de la commande).

### Gestion du stock

Pour ajuster rapidement le stock :
- Éditez le produit, modifiez uniquement le champ Stock
- Ou utilisez le bouton **+10** sur la ligne pour incrémenter rapidement

## Gestion des commandes

Section **Commandes** — tableau de toutes les commandes.

**Actions possibles selon le statut :**
- `paid` (payée) → clic **Marquer expédiée** → passe en `shipped`
- `shipped` (expédiée) → clic **Marquer livrée** → passe en `delivered`

Chaque changement met à jour le statut côté utilisateur (visible dans son compte).

## Gestion des permis

Section **Permis** — toutes les demandes.

**Actions sur une demande en attente (`pending`) :**
- **Approuver** → statut passe en `approved`, email loggé
- **Rejeter** → statut passe en `rejected`, email loggé

La timeline de l'utilisateur est mise à jour automatiquement avec la date de décision.

## Gestion des concours

### Ajouter un concours

Section **Concours** → **+ Ajouter un concours** → remplir :
- **Identifiant (slug)** — `ex: tet-2026-07`
- **Titre, Lieu** — obligatoires
- **Date ISO** — format `YYYY-MM-DD`
- **Date affichée** — format `JJ MOIS` (ex: `12 JUIL`)
- **Distance, Format, Prix, Inscrits, Places max**
- **Espèces** — slugs séparés par virgules
- **Règlement** — texte libre

### Modifier / supprimer

Boutons **Éditer** et **Supprimer** sur chaque ligne. La suppression efface également toutes les inscriptions au concours.

## Catégories / Techniques / Espèces

Ces entités référentielles sont gérées **uniquement via l'API backend** pour le moment (pas d'UI admin dédiée dans la version actuelle). Les routes sont :

```
POST/PUT/DELETE /api/categories[/:id]
POST/PUT/DELETE /api/techniques[/:id]
POST/PUT/DELETE /api/species[/:id]
```

Toutes protégées par `ROLE_ADMIN`. Exemple avec curl :

```bash
TOKEN="<votre-jwt-admin>"
curl -X POST http://localhost:8080/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"fly-reels","name":"Moulinets mouche","count":15}'
```

## Se déconnecter

Sidebar admin → **Se déconnecter** en bas.

## Raccourcis utiles

**Inspecter la BDD Postgres :**
```bash
docker exec -it hookcook-postgres-1 psql -U hookcook -d hookcook
```

**Reset complet (efface tout — seed automatique au prochain boot) :**
```bash
docker compose down -v && docker compose up -d postgres
cd backend && ./grailsw run-app
```

**Logs backend :**
- Les notifications email (permis décision, confirmation commande, inscription concours) sont affichées dans le terminal Grails au format :
  ```
  =================== MAIL ===================
   To      : user@example.fr
   Subject : Permis FR-2026-XXXXX — Approuvé
   Body    : ...
  ============================================
  ```

## Sécurité en prod

Avant de déployer en production :

1. Change le `HC_JWT_SECRET` (variable d'env, 64 caractères min)
2. Change le mot de passe admin par défaut
3. Révise la config CORS (`backend/src/main/groovy/backend/config/CorsConfig.groovy`) pour n'autoriser que tes domaines
4. Configure un SMTP réel si tu veux envoyer de vrais emails
5. Passe `dbCreate: validate` au lieu de `update` en prod (`application.yml` → production section)
