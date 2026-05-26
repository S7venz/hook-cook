---
hide:
  - navigation
  - toc
---

# Hook & Cook

**Boutique en ligne de matériel de pêche, gestion des permis et des concours locaux.**
Application multicouche sécurisée — projet support du Titre Professionnel **CDA TP-01281** (Concepteur Développeur d'Applications, niveau 6).

<div class="badges" markdown>
![Grails](https://img.shields.io/badge/Grails-6.2-48b983?logo=grails&logoColor=white)
![Groovy](https://img.shields.io/badge/Groovy-3-4298b8?logo=apachegroovy&logoColor=white)
![Spring](https://img.shields.io/badge/Spring%20Boot-3-6db33f?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff?logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)
</div>

## Par où commencer ?

<div class="grid cards" markdown>

-   :material-sitemap:{ .lg .middle } &nbsp; **Architecture**

    ---

    Architecture multicouche, choix SQL + NoSQL justifié par nature de donnée, DICP par couche, éco-conception.

    [→ Lire la doc d'architecture](ARCHITECTURE.md)

-   :material-api:{ .lg .middle } &nbsp; **API REST**

    ---

    Référence complète des endpoints : authentification, produits, commandes, permis, concours, paiements Stripe, RGPD…

    [→ Référence de l'API](API.md)

-   :material-database:{ .lg .middle } &nbsp; **Modèle de données**

    ---

    Diagramme entité-association, tables Postgres, contraintes, clés étrangères. Issue des domaines GORM et du seed SQL.

    [→ Modèle relationnel](ERD.md)

-   :material-account-circle:{ .lg .middle } &nbsp; **Guide utilisateur**

    ---

    Parcours pas-à-pas côté client : compte, panier, paiement, permis, concours, carnet de prises, favoris, RGPD.

    [→ Guide utilisateur](GUIDE-UTILISATEUR.md)

-   :material-shield-account:{ .lg .middle } &nbsp; **Guide administrateur**

    ---

    Tableau de bord admin : gestion catalogue, commandes, permis, concours, statistiques, export CSV, emails.

    [→ Guide admin](GUIDE-ADMIN.md)

-   :material-flask-outline:{ .lg .middle } &nbsp; **Plan de tests**

    ---

    Les 7 types de tests en place : unitaires, intégration, non-régression,
    E2E Playwright, charge k6, sécurité OWASP ZAP, recette utilisateur.

    [→ Plan de tests](PLAN-TESTS.md)

-   :material-shield-search:{ .lg .middle } &nbsp; **Veille & sécurité**

    ---

    Sources surveillées, outils d'automatisation (Dependabot), rituel hebdomadaire,
    applications concrètes au projet et faille trouvée + corrigée.

    [→ Veille technologique et sécurité](VEILLE.md)

-   :material-chart-line:{ .lg .middle } &nbsp; **Audits RGAA + perf + éco**

    ---

    Audits Lighthouse, Pa11y (WCAG 2.0 AA) et Ecoindex sur 5 pages clés.
    Scores, plan d'action priorisé, rapports HTML interactifs.

    [→ Voir les audits](AUDITS.md)

-   :material-github:{ .lg .middle } &nbsp; **Code source**

    ---

    Le repo, les issues, les pull requests. Le code parle en complément de cette doc.

    [→ Voir sur GitHub](https://github.com/S7venz/hook-cook)

</div>

## Démarrage en deux commandes

```bash
git clone https://github.com/S7venz/hook-cook.git
cd hook-cook
cp .env.example .env
docker compose up -d
```

!!! tip "Zéro configuration requise"
    Les valeurs par défaut de `.env.example` sont conçues pour un **clone-and-run** :
    Postgres en local, Redis en local, mails loggés à la console, Stripe en mode mock
    (commandes/permis/concours validés directement sans paiement réel).
    Seed démo activé : 10 utilisateurs, 18 commandes, 6 permis, 10 inscriptions concours, etc.

Une fois les conteneurs prêts :

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| API REST | <http://localhost:8080> |
| Healthcheck | <http://localhost:8080/actuator/health> |

**Compte admin par défaut** : `admin@hookcook.fr` / `admin1234`

## Périmètre fonctionnel

=== ":material-cart: Boutique"

    - Catalogue 11 produits seed (avec images) — catégories, techniques, espèces ciblées
    - Recherche, tri (prix, nouveautés, popularité), filtre prix
    - Panier persistant (localStorage), checkout en 3 étapes
    - Paiement Stripe (PaymentIntent + webhook signé) ou mode mock automatique
    - Avis produits modérables, favoris, alertes retour en stock

=== ":material-fish: Permis"

    - 3 types de permis (annuel, hebdomadaire, journée) sur 4 départements éligibles
    - Demande dématérialisée avec pièces jointes (carte d'identité, justificatif)
    - Validation admin, paiement Stripe, génération PDF + envoi email

=== ":material-trophy: Concours"

    - 4 concours seed localisés (Perpignan) avec dates, lieu, type
    - Inscription utilisateur payante via Stripe
    - Drilldown admin pour voir la liste des inscrits par concours

=== ":material-notebook: Carnet de prises"

    - Saisie d'une prise : espèce, taille, poids, date, lieu, photo
    - Leaderboard mensuel (par espèce ou global) avec règles d'égalité documentées
    - Privacy : prénom + initiale nom uniquement côté public

=== ":material-shield-lock: Sécurité"

    - JWT HS512 + BCrypt 12 rounds
    - Rate-limit anti-brute-force partagé via **Redis**
    - Idempotence des webhooks Stripe (déduplication des re-livraisons)
    - CSP stricte côté nginx, RGPD (export + suppression compte)

## Veille et amélioration continue

!!! info "Projet pédagogique"
    Cette documentation accompagne le **dossier de projet CDA**. Elle est versionnée
    avec le code (`docs/` dans le repo) et générée automatiquement par **MkDocs Material**
    à chaque push sur la branche `main` via GitHub Actions.

---

<center>
*Hook & Cook — Cengizhan Özbek — 2026*
</center>
