# Guide utilisateur — Hook & Cook

Guide pas-à-pas pour naviguer dans la boutique, demander un permis et s'inscrire à un concours.

---

## 1. Créer un compte

1. Cliquez sur l'icône **utilisateur** en haut à droite → **Se connecter**
2. Au bas de l'écran, cliquez sur **Créer un compte**
3. Renseignez prénom, nom, email et mot de passe (minimum 8 caractères)
4. Vous êtes automatiquement connecté·e et redirigé·e vers **Mon compte**

Votre session reste active 12h. Le rechargement de la page conserve votre connexion.

## 2. Parcourir la boutique

Accédez à **Boutique** dans la navigation ou via l'URL `/boutique`.

**Filtrer :**
- **Catégorie** — cannes, moulinets, leurres, vêtements…
- **Espèce ciblée** — truite, brochet, carpe…
- **Technique** — mouche, carnassiers, pêche au fond…
- **En stock** — masque les ruptures
- **Barre de recherche** — texte libre (nom, SKU, marque)

**Trier** — par pertinence, prix croissant/décroissant, ou mieux notés.

Cliquez sur une carte pour voir la **fiche produit** complète (galerie, variantes, caractéristiques techniques, saisonnalité, story artisan, avis).

## 3. Acheter un article

1. Sur la fiche produit ou la vignette, cliquez **Ajouter au panier**
2. Le compteur dans la top nav s'incrémente
3. Cliquez l'icône **panier** pour consulter le récapitulatif
4. Ajustez les quantités ou retirez un article
5. Cliquez **Passer commande**
6. Remplissez en 3 étapes :
   - **Coordonnées** (email, prénom, nom, téléphone)
   - **Livraison** (adresse + mode : Standard 48h / Chronopost 24h / Point relais)
   - **Paiement** (carte — Stripe mocké pour l'instant)
7. Votre commande reçoit une référence `HC-2186-XXXX` et s'affiche sur la page de confirmation

Retrouvez toutes vos commandes dans **Mon compte → Commandes** avec leur statut (payée, expédiée, livrée).

## 4. Demander un permis de pêche

1. Accédez à **Permis** dans la navigation
2. Cliquez **Commencer ma demande**
3. Parcourez les 4 étapes :
   - **Type** — annuel (92 €) / semaine (28 €) / découverte (6 €)
   - **Identité** — prénom, nom, date de naissance, département
   - **Pièces justificatives** — simulez l'upload de la carte d'identité + photo
   - **Récapitulatif** — vérifiez et cochez les CGV
   - **Paiement** — carte
4. Votre permis reçoit une référence `FR-2026-XXXXX`
5. Le **suivi** affiche une timeline temps réel :
   - ✓ Demande envoyée
   - ✓ Paiement confirmé
   - ✓ En instruction (fédération)
   - ⏳ Décision

Vous recevez un email (loggé côté serveur) dès que votre permis est approuvé ou rejeté par l'administrateur.

## 5. S'inscrire à un concours

1. Accédez à **Concours**
2. Filtrez par espèce (Tous / Truite / Carnassiers / Carpe)
3. Cliquez sur un concours dans la liste à gauche pour voir sa fiche détaillée
4. Cliquez **S'inscrire**
5. Choisissez votre catégorie (Hommes Expérimenté / Amateur / Femmes / Jeunes)
6. Vérifiez votre numéro de permis (format `FR-AAAA-NNNNN`)
7. Cliquez **Confirmer mon inscription**

Vos inscriptions sont visibles dans **Mon compte → Concours**.

## 6. Mon compte

Accessible via `/compte` ou l'icône utilisateur.

**Onglets disponibles :**

- **Aperçu** — stats (permis, prises saisies, commandes, concours)
- **Commandes** — historique avec détails et statut de livraison
- **Permis** — votre permis en cours avec timeline
- **Concours** — liste des concours où vous êtes inscrit·e
- **Carnet de prise** — journal personnel des poissons attrapés
- **Adresses** — à implémenter
- **Paramètres** — déconnexion

**Ajouter une prise au carnet :**
1. Onglet **Carnet de prise** → bouton **+ Ajouter une prise**
2. Sélectionnez l'espèce, renseignez taille, poids, lieu, appât, date
3. Enregistrez — la carte apparaît dans votre grille carnet

## 7. Se déconnecter

**Mon compte → Paramètres → Se déconnecter**

Votre token est effacé du navigateur. Vous redevenez un visiteur anonyme.
