# Guide utilisateur — Hook & Cook

Guide pas-à-pas pour naviguer dans la boutique, demander un permis, s'inscrire à un concours et utiliser les fonctions compte (favoris, avis, carnet, RGPD).

---

## 1. Créer un compte

1. Cliquez sur l'icône **utilisateur** en haut à droite → **Se connecter**
2. Au bas de l'écran, cliquez sur **Créer un compte**
3. Renseignez prénom, nom, email et mot de passe (minimum 8 caractères)
4. Vous êtes automatiquement connecté·e et redirigé·e vers **Mon compte**

Votre session reste active 12h. Le rechargement de la page conserve votre connexion.

## 2. Mot de passe oublié

Si vous avez oublié votre mot de passe :

1. Sur la page **Se connecter**, cliquez sur **Mot de passe oublié ?** (sous le champ mot de passe)
2. Saisissez l'email de votre compte
3. Si un compte existe avec cet email, vous recevez un email avec un lien (valable **1 heure**, **usage unique**)
4. Cliquez le lien dans l'email → tapez votre nouveau mot de passe deux fois → validez
5. Redirigé·e automatiquement sur la page de connexion — vous pouvez vous reconnecter avec le nouveau mot de passe

Le message affiché est toujours le même que l'email existe ou pas (sécurité anti-énumération).

## 3. Parcourir la boutique

Accédez à **Boutique** dans la navigation ou via l'URL `/boutique`.

**Filtrer :**
- **Catégorie** — cannes, moulinets, leurres, vêtements…
- **Espèce ciblée** — truite, brochet, carpe…
- **Technique** — mouche, carnassiers, pêche au fond…
- **En stock** — masque les ruptures
- **Barre de recherche** — texte libre avec tolérance aux fautes de frappe (tape « cane » → trouve « canne »)

**Trier** — par pertinence, prix croissant/décroissant, ou mieux notés.

Cliquez sur une carte pour voir la **fiche produit** complète (galerie, variantes, caractéristiques techniques, saisonnalité, story artisan, avis, produits souvent achetés avec).

### Ajouter un produit aux favoris

Sur chaque carte produit et fiche produit, cliquez le **cœur** en haut à droite pour ajouter/retirer des favoris. Retrouvez la liste dans **Mon compte → Favoris**.

### Être prévenu d'un retour en stock

Sur une fiche produit **épuisée**, le bouton « Ajouter au panier » est remplacé par **« Me prévenir quand dispo »**. Un clic inscrit votre email ; vous recevez un mail automatique dès que l'admin réapprovisionne.

## 4. Acheter un article

1. Sur la fiche produit ou la vignette, cliquez **Ajouter au panier**
2. Le compteur dans la top nav s'incrémente
3. Cliquez l'icône **panier** pour consulter le récapitulatif
4. Ajustez les quantités ou retirez un article
5. Cliquez **Passer commande**
6. Remplissez en 3 étapes :
   - **Coordonnées** (email, prénom, nom, téléphone)
   - **Livraison** (adresse + mode : Standard 48h / Chronopost 24h / Point relais)
   - **Paiement** (carte — Stripe mocké pour l'instant)
7. Votre commande reçoit une référence `HC-2186-XXXXXXXX`

Sur la page de confirmation et dans **Mon compte → Commandes**, vous pouvez **télécharger la facture PDF** d'une commande en un clic.

Retrouvez toutes vos commandes dans **Mon compte → Commandes** avec leur statut (payée, expédiée, livrée).

## 5. Laisser un avis sur un produit

1. Allez sur la fiche d'un produit que vous avez acheté (commandes en statut `payée`, `expédiée` ou `livrée`)
2. Cliquez l'onglet **Avis**
3. Si vous êtes éligible, un formulaire apparaît :
   - Note sur **5 étoiles** (obligatoire)
   - **Titre** (optionnel)
   - **Commentaire** (minimum 10 caractères)
4. Cliquez **Publier mon avis** — il apparaît instantanément avec un badge **« Achat vérifié »**

Règles :
- Seuls les clients ayant acheté le produit peuvent laisser un avis
- Un seul avis par personne et par produit
- La note moyenne du produit se met à jour automatiquement

## 6. Demander un permis de pêche

1. Accédez à **Permis** dans la navigation
2. Cliquez **Commencer ma demande**
3. Parcourez les 5 étapes :
   - **Type** — annuel (92 €) / semaine (28 €) / découverte (6 €)
   - **Identité** — prénom, nom, date de naissance, département
   - **Pièces justificatives** — upload réel carte d'identité + photo (JPG/PNG/WebP, max 8 Mo)
   - **Récapitulatif** — vérifiez et cochez les CGV
   - **Paiement** — carte
4. Votre permis reçoit une référence `FR-2026-XXXXXXXXXX`
5. Le **suivi** affiche une timeline temps réel :
   - ✓ Demande envoyée
   - ✓ Paiement confirmé
   - ✓ En instruction (fédération)
   - ⏳ Décision

Vous recevez un email (via SMTP configuré, sinon loggé côté serveur) dès que votre permis est approuvé ou rejeté par l'administrateur.

Les pièces justificatives uploadées ne sont accessibles qu'à vous et aux administrateurs.

## 7. S'inscrire à un concours

1. Accédez à **Concours**
2. Filtrez par espèce (Tous / Truite / Carnassiers / Carpe)
3. Cliquez sur un concours dans la liste à gauche pour voir sa fiche détaillée, ou sur une épingle de la carte Leaflet à droite
4. Cliquez **S'inscrire**
5. Choisissez votre catégorie (Hommes Expérimenté / Amateur / Femmes / Jeunes)
6. Vérifiez votre numéro de permis
7. Cliquez **Confirmer mon inscription**

Vos inscriptions sont visibles dans **Mon compte → Concours**.

## 8. Participer aux challenges mensuels

Le site organise un **classement mensuel** des plus grosses prises consignées dans les carnets de la communauté.

1. Accédez à **Challenges** dans la navigation
2. Filtrez par mois, année et espèce
3. Le top 3 apparaît avec médailles 🥇🥈🥉

Pour y participer, il suffit d'ajouter vos prises dans votre carnet (voir section 9).

## 9. Mon compte

Accessible via `/compte` ou l'icône utilisateur.

**Onglets disponibles :**

- **Aperçu** — stats (permis, prises saisies, commandes, concours)
- **Commandes** — historique avec détails, statut de livraison, téléchargement facture PDF
- **Permis** — votre permis en cours avec timeline
- **Concours** — liste des concours où vous êtes inscrit·e
- **Carnet de prise** — journal personnel des poissons attrapés
- **Favoris** — produits ajoutés via le cœur des cartes
- **Adresses** — affichage de votre adresse de livraison
- **Paramètres** — profil, déconnexion, **section RGPD**

**Ajouter une prise au carnet :**
1. Onglet **Carnet de prise** → bouton **+ Ajouter une prise**
2. Sélectionnez l'espèce, renseignez taille, poids, lieu, appât, date
3. Enregistrez — la carte apparaît dans votre grille carnet

Astuce : les URLs comme `/compte#carnet` ou `/compte#favoris` ouvrent directement sur le bon onglet (pratique pour partager un lien).

## 10. Droits RGPD (export et suppression)

Dans **Mon compte → Paramètres**, la section **Données personnelles · RGPD** vous offre :

### Télécharger mes données

Cliquez **Exporter** → un fichier JSON est téléchargé contenant l'intégralité de vos données : profil, commandes, permis, inscriptions concours, carnet, favoris, avis, alertes stock.

Conforme à l'article 15 (droit d'accès) et l'article 20 (portabilité) du RGPD.

### Supprimer mon compte

Action **irréversible**. Procédure :

1. Cliquez **Supprimer mon compte**
2. Un panneau rouge apparaît avec un champ de confirmation
3. Tapez le mot **SUPPRIMER** (en majuscules)
4. Cliquez **Supprimer définitivement**

Effets :
- **Données supprimées** immédiatement : favoris, alertes stock, carnet, avis, inscriptions concours
- **Données anonymisées** : permis (nom/prénom/date de naissance effacés), commandes (adresse remplacée, email anonymisé) — ces éléments sont conservés 10 ans pour obligation fiscale/légale mais ne sont plus rattachés à votre identité
- **Reconnexion impossible** : votre hash BCrypt est invalidé

Conforme à l'article 17 (droit à l'effacement).

## 11. Se déconnecter

**Mon compte → Paramètres → Se déconnecter**

Votre token est effacé du navigateur. Vous redevenez un visiteur anonyme.

---

## Raccourcis URL utiles

| URL | Ce qu'elle ouvre |
|---|---|
| `/boutique?category=cannes` | Boutique filtrée sur les cannes |
| `/boutique?species=truite` | Boutique filtrée sur l'espèce truite |
| `/compte#favoris` | Mes favoris directement |
| `/compte#carnet` | Mon carnet de prises directement |
| `/compte#parametres` | Section RGPD / déconnexion |
| `/a-propos#histoire` | Histoire de la boutique |
| `/aide` | FAQ complète |
| `/legal/cgv`, `/legal/mentions-legales`, etc. | Pages légales |
| `/mot-de-passe-oublie` | Démarrer un reset de mot de passe |
