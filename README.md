# Hook & Cook

Application web de gestion d'un magasin d'articles de pêche : boutique en ligne, demandes de permis et inscriptions aux concours locaux.

Projet réalisé dans le cadre d'un module de développement web.

## Fonctionnalités

- Catalogue de produits avec catégories (cannes, appâts, vêtements, etc.)
- Panier, recherche, filtres et paiement en ligne
- Espace client (inscription, profil, historique des commandes)
- Demande de permis de pêche avec suivi du statut
- Inscription aux concours organisés par le magasin
- Interface d'administration

## Stack

- Grails (Groovy) — REST API + Spring Security
- React
- PostgreSQL
- JWT + BCrypt
- Stripe / PayPal

## Prérequis

- JDK 17+
- Grails 6+
- Node.js 18+
- Docker

## Installation

```bash
git clone https://github.com/S7venz/hook-cook.git
cd hook-cook
cp .env.example .env

docker compose up -d postgres

cd backend
./grailsw run-app
```

Dans un autre terminal :

```bash
cd frontend
npm install
npm run dev
```

Frontend sur `http://localhost:5173`, API sur `http://localhost:8080`.

## Structure

```
backend/    API Grails
frontend/   Application React
```
