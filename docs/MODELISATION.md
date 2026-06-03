---
tags:
  - UML
  - Modélisation
  - CP5
  - CP6
---

# Modélisation UML

!!! abstract "Objectif"
    Cette page rassemble les **4 diagrammes UML de référence** du projet,
    rendus en **Mermaid** (visibles directement dans le site MkDocs et GitHub) :

    1. **Diagramme de cas d'utilisation** — vue globale des acteurs et fonctionnalités
    2. **Diagramme de séquence — commande Stripe** (fonctionnalité la plus représentative)
    3. **Diagramme de séquence — workflow permis**
    4. **Diagramme de composants Docker** — vue déploiement

    Les diagrammes d'architecture multicouche et le DICP sont dans
    [`ARCHITECTURE.md`](ARCHITECTURE.md) et [`SECURITE.md`](SECURITE.md).
    Le modèle entité-association est dans [`ERD.md`](ERD.md).

## 1. Diagramme de cas d'utilisation

Vue d'ensemble des acteurs (Visiteur, Client authentifié, Administrateur,
système Stripe) et des cas d'utilisation principaux du système.

```mermaid
flowchart LR
    Visiteur((Visiteur))
    Client((Client<br/>ROLE_USER))
    Admin((Admin<br/>ROLE_ADMIN))
    Stripe([Stripe])

    subgraph SYS[Système Hook & Cook]
        direction TB

        subgraph PUB[Accessible sans compte]
            UC1[Parcourir le catalogue]
            UC2[Consulter un produit]
            UC3[S'inscrire]
            UC4[Se connecter]
            UC5[Consulter les concours]
            UC6[Voir le leaderboard]
        end

        subgraph AUTH[Authentifié — ROLE_USER]
            UC7[Passer une commande]
            UC8[Payer en ligne]
            UC9[Suivre mes commandes]
            UC10[Demander un permis]
            UC11[S'inscrire à un concours]
            UC12[Saisir au carnet]
            UC13[Gérer mes favoris]
            UC14[Laisser un avis]
            UC15[Exporter mes données RGPD]
            UC16[Supprimer mon compte]
        end

        subgraph ADM[Réservé — ROLE_ADMIN]
            UC17[Gérer le catalogue]
            UC18[Gérer les commandes]
            UC19[Valider les permis]
            UC20[Gérer les concours]
            UC21[Consulter les statistiques]
            UC22[Exporter en CSV]
        end

        subgraph EXT[Asynchrone — externe]
            UC23[Webhook paiement reçu]
        end
    end

    Visiteur --> UC1
    Visiteur --> UC2
    Visiteur --> UC3
    Visiteur --> UC4
    Visiteur --> UC5
    Visiteur --> UC6

    Client --> UC7
    Client --> UC8
    Client --> UC9
    Client --> UC10
    Client --> UC11
    Client --> UC12
    Client --> UC13
    Client --> UC14
    Client --> UC15
    Client --> UC16

    Admin --> UC17
    Admin --> UC18
    Admin --> UC19
    Admin --> UC20
    Admin --> UC21
    Admin --> UC22

    Stripe --> UC23

    UC8 -.->|déclenche| UC23
    UC10 -.->|déclenche| UC23
    UC11 -.->|déclenche| UC23

    classDef vis fill:#1976d2,stroke:#0d47a1,color:#fff
    classDef cli fill:#388e3c,stroke:#1b5e20,color:#fff
    classDef adm fill:#d32f2f,stroke:#b71c1c,color:#fff
    classDef ext fill:#635bff,stroke:#3c3aa6,color:#fff
    class UC1,UC2,UC3,UC4,UC5,UC6 vis
    class UC7,UC8,UC9,UC10,UC11,UC12,UC13,UC14,UC15,UC16 cli
    class UC17,UC18,UC19,UC20,UC21,UC22 adm
    class UC23 ext
```

### Lecture

- **Visiteur** (rond bleu) accède à la couche publique sans authentification : navigation produit, inscription, login, consultation des concours et du leaderboard.
- **Client** (rond vert) hérite des droits Visiteur + actions privées (commande, permis, concours, carnet, favoris, RGPD).
- **Admin** (rond rouge) hérite des droits Client + actions de gestion (catalogue, validation permis, stats).
- **Stripe** (rond violet) est un acteur externe qui déclenche le cas asynchrone *Webhook paiement reçu* après les actions de paiement (commande, permis, concours).
- Les **flèches pointillées** indiquent les déclencheurs asynchrones (`UC8 → UC23` : payer en ligne provoque la réception ultérieure du webhook Stripe).

## 2. Diagramme de séquence — Commande Stripe (fonctionnalité représentative)

Scénario nominal : un client authentifié passe une commande, paye avec
Stripe, et reçoit la confirmation par email après réception du webhook.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client
    participant FE as Frontend<br/>React
    participant API as Backend<br/>Grails REST
    participant Order as OrderService
    participant DB as PostgreSQL
    participant Redis
    participant Stripe as Stripe API
    participant Mail as MailService

    Note over User,FE: 1. Préparation du panier
    User->>FE: Ajoute des produits au panier
    User->>FE: Clique "Passer commande"
    FE->>API: POST /api/orders<br/>(items, adresse, JWT)
    API->>Order: create(user, payload)

    Note over Order,DB: 2. Validation + recalcul serveur
    Order->>DB: SELECT products IN (...)
    DB-->>Order: produits + prix actuels
    Order->>Order: Vérifier stock disponible
    Order->>Order: Recalculer total<br/>(jamais confiance au client)

    alt Stock insuffisant
        Order-->>API: error: stock insufficient
        API-->>FE: 400 + message
        FE-->>User: Affiche erreur stock
    end

    Note over Order,Stripe: 3. Création PaymentIntent Stripe
    Order->>Stripe: POST /payment_intents<br/>(amount, currency, metadata)
    Stripe-->>Order: PaymentIntent (id, client_secret)

    Note over Order,DB: 4. Persistance commande (status pending)
    Order->>DB: INSERT order (status=pending,<br/>stripePaymentIntentId, total)
    Order->>DB: INSERT order_items
    DB-->>Order: OK (id, reference HC-2026-XXXX)
    Order-->>API: order + clientSecret + publishableKey
    API-->>FE: 201 (order + clientSecret)

    Note over FE,Stripe: 5. Paiement côté navigateur (Stripe Elements)
    FE->>Stripe: confirmCardPayment(clientSecret, card)
    Note right of Stripe: Aucune donnée carte<br/>ne touche notre serveur
    Stripe-->>FE: paymentIntent.status = succeeded
    FE-->>User: Redirection /confirmation

    Note over Stripe,API: 6. Webhook asynchrone (peut arriver avant ou après l'étape 5)
    Stripe->>API: POST /api/payments/webhook<br/>+ Stripe-Signature
    API->>API: verifyWebhook(payload, signature)<br/>HMAC SHA-256

    alt Signature invalide
        API-->>Stripe: 400 (rejette)
    end

    API->>Redis: SETNX webhook:stripe:{event.id} 1 EX 86400

    alt Event déjà traité (idempotence)
        Redis-->>API: false (déjà vu)
        API-->>Stripe: 200 (idempotent: true)
    else Premier passage
        Redis-->>API: true (premier passage)
        API->>Order: markPaidByPaymentIntent(pi.id)
        Order->>DB: UPDATE order SET status=paid<br/>WHERE stripePaymentIntentId=...
        Order->>DB: UPDATE products SET stock = stock - qty
        Order->>Mail: sendOrderConfirmation(user, order)
        Mail-->>User: Email de confirmation
        Order-->>API: OK
        API-->>Stripe: 200 (received: true)
    end
```

### Lecture

- **Étapes 1-2** : préparation côté client + validation serveur. Le total est **recalculé serveur** à partir du prix BDD — on ne fait jamais confiance au montant envoyé par le client (mitigation tampering OWASP A04).
- **Étape 3** : création du PaymentIntent côté Stripe — c'est Stripe qui détient le contrôle du paiement, on récupère juste le `clientSecret` à transmettre au front.
- **Étape 4** : la commande est créée en BDD avec **statut `pending`**. Pas de décrément stock à cette étape — on attend la confirmation Stripe.
- **Étape 5** : paiement effectué côté navigateur via **Stripe Elements**. La carte ne passe jamais par notre serveur (conformité PCI-DSS SAQ A).
- **Étape 6** : le webhook est asynchrone et peut arriver **avant ou après** la redirection front. Il est :
  - **Signé** (HMAC SHA-256, refus si invalide) — mitigation A08
  - **Idempotent** (SETNX Redis 24h) — résistance aux re-livraisons Stripe
  - Si premier passage : statut → `paid`, stock décrémenté, email envoyé.
  - Si re-livraison : court-circuit immédiat, on retourne 200 sans rien faire.

### Cas d'erreur couverts

- Signature webhook invalide → 400
- Event Stripe déjà traité → 200 idempotent
- Stock insuffisant à la création → 400 avec message clair
- Redis down → fail-open (l'idempotence de `markPaidByPaymentIntent` côté BDD prend le relais)
- Stripe API down → fallback en mode mock automatique (utile pour CI et démo)

## 3. Diagramme de séquence — Workflow permis

Scénario nominal : un client demande un permis annuel, paye, l'admin valide
la demande, l'utilisateur reçoit son PDF.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client
    actor Admin
    participant FE as Frontend
    participant API as Backend Grails
    participant Permit as PermitService
    participant DB as PostgreSQL
    participant Upload as UploadController
    participant Stripe as Stripe API
    participant Mail as MailService

    Note over User,FE: Phase 1 — Saisie de la demande
    User->>FE: Clique "Demander un permis"
    FE->>FE: Wizard 5 étapes<br/>(type, identité, département, pièces, paiement)
    User->>FE: Upload pièce d'identité + photo
    FE->>API: POST /api/uploads (multipart, JWT)
    API->>Upload: upload(file)
    Upload->>Upload: Vérifier magic bytes<br/>+ extension whitelist
    Upload-->>API: { url, filename }
    API-->>FE: 201 + URL accessible

    Note over User,DB: Phase 2 — Création de la demande + paiement
    User->>FE: Valide la demande
    FE->>API: POST /api/permits<br/>(typeId, firstName, idDocUrl, ...)
    API->>Permit: create(user, payload)
    Permit->>DB: INSERT permit<br/>(status=pending_payment, history)
    Permit->>Stripe: createPaymentIntent(amount, metadata)
    Stripe-->>Permit: PaymentIntent
    Permit->>DB: UPDATE permit SET stripePaymentIntentId=...
    Permit-->>API: { permit, clientSecret }
    API-->>FE: 201
    FE->>Stripe: confirmCardPayment(clientSecret)
    Stripe-->>FE: succeeded
    FE-->>User: "Demande envoyée, attente validation"

    Note over Stripe,Mail: Phase 3 — Webhook Stripe (idempotency Redis vérifiée, omis ici)
    Stripe->>API: POST /api/payments/webhook (payment_intent.succeeded)
    API->>Permit: markPaidByPaymentIntent(pi.id)
    Permit->>DB: UPDATE permit SET status=pending<br/>(en instruction)
    Permit->>Mail: notifyPaymentReceived(user, permit)
    Mail-->>User: Email "Paiement confirmé"

    Note over Admin,Mail: Phase 4 — Validation administrateur
    Admin->>FE: Se connecte sur /admin
    FE->>API: GET /api/permits (JWT admin)
    API->>Permit: all()
    Permit->>DB: SELECT permits ORDER BY date_created DESC
    DB-->>API: liste permis
    API-->>FE: 200 + permis
    Admin->>FE: Examine la pièce d'identité
    Admin->>FE: Clique "Valider"
    FE->>API: PATCH /api/permits/{ref}<br/>{status: 'approved'}
    API->>Permit: updateStatus(ref, 'approved')
    Permit->>DB: UPDATE permit SET status=approved
    Permit->>Mail: permitDecision(user, permit, 'approved')
    Mail-->>User: Email "Permis approuvé"<br/>+ PDF en pièce jointe
    Permit-->>API: OK
    API-->>FE: 200

    Note over User: Phase 5 — Consultation
    User->>FE: Va sur /compte → permis
    FE->>API: GET /api/permits/me
    API->>Permit: currentForUser(user)
    Permit->>DB: SELECT permits WHERE user=...
    Permit-->>API: permis avec status=approved
    API-->>FE: 200
    FE-->>User: Affiche permis valide avec PDF téléchargeable
```

### Lecture

- **Phase 1** : upload sécurisé des pièces. Validation par **magic bytes** (un `.php` renommé en `.jpg` est rejeté à l'octet 0), nom de fichier UUID 128 bits (impossible à brute-forcer), accès restreint au propriétaire ou admin.
- **Phase 2** : la demande est créée en BDD avec `status=pending_payment`. Le PaymentIntent Stripe est créé immédiatement et son ID stocké pour permettre la corrélation au webhook.
- **Phase 3** : le webhook fait basculer le statut à `pending` (= en instruction admin). Email automatique.
- **Phase 4** : l'admin authentifié (`isAdmin()` vérifié à chaque appel) examine et valide. Email de décision envoyé avec PDF.
- **Phase 5** : le client consulte son permis dans son espace.

### Statuts possibles

| Statut | Description |
|---|---|
| `pending_payment` | Demande créée, en attente de paiement Stripe |
| `payment_failed` | Paiement échoué (carte refusée, 3DS abandonné, etc.) |
| `pending` | Paiement confirmé, en instruction admin |
| `approved` | Validé par l'admin, PDF envoyé |
| `rejected` | Refusé par l'admin avec motif |

## 4. Diagramme de composants Docker

Vue déploiement : organisation des conteneurs, ports exposés, dépendances
et bind mounts.

```mermaid
flowchart TB
    User([Navigateur])

    subgraph HOST[Host Docker]
        subgraph NET[Réseau Docker interne]
            FE[frontend<br/>nginx 1.27 + React 19 build<br/>:80 → :5173]
            BE[backend<br/>Grails 6 + JDK 17<br/>:8080]
            PG[(postgres:16-alpine<br/>:5432)]
            RD[(redis:7-alpine<br/>:6379)]
        end

        VOL1[(uploads/<br/>bind mount)]
        VOL2[(pgdata<br/>named volume)]
        VOL3[(redisdata<br/>named volume)]
    end

    Stripe([Stripe API])
    SMTP([SMTP relay])
    LE[/Let's Encrypt<br/>en prod/]

    User -->|HTTPS :443| LE
    LE -->|HTTP :80| FE
    FE -->|REST + JWT| BE
    BE --> PG
    BE <--> RD
    BE -->|Webhook signé| Stripe
    Stripe -->|Webhook async| BE
    BE -->|Email confirmation| SMTP

    BE -.-> VOL1
    PG -.-> VOL2
    RD -.-> VOL3

    classDef container fill:#0d7377,stroke:#06545b,color:#fff
    classDef volume fill:#888,stroke:#555,color:#fff,stroke-dasharray:3 3
    classDef ext fill:#635bff,stroke:#3c3aa6,color:#fff
    class FE,BE,PG,RD container
    class VOL1,VOL2,VOL3 volume
    class Stripe,SMTP,LE ext
```

### Lecture

- **4 services** orchestrés par `docker-compose.yml` avec **healthchecks** :
  - `postgres` : `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`
  - `redis` : `redis-cli -a $REDIS_PASSWORD ping`
  - `backend` : `curl /actuator/health`
  - `frontend` : `wget --spider /`
- **Dépendances de boot** : `backend` ne démarre que si `postgres` et `redis`
  sont `service_healthy`. `frontend` ne démarre que si `backend` est `healthy`.
- **3 volumes** :
  - **`uploads/`** : bind mount du dossier repo `backend/uploads/` → permet d'ajouter
    des images sans rebuild de l'image Docker
  - **`pgdata`** : volume nommé, données Postgres durables (WAL inclus)
  - **`redisdata`** : volume nommé, AOF activé pour la durabilité Redis
- **Ports** :
  - Frontend `:5173` (mapping `5173:80`)
  - Backend `:8080`
  - Postgres et Redis **bind localhost** uniquement (`127.0.0.1:5432`, `127.0.0.1:6379`) — pas exposés sur le LAN
- **Externe** :
  - **Stripe** : double sens (création PaymentIntent côté backend + webhooks reçus)
  - **SMTP** : sortant uniquement (envoi emails confirmation, password reset, décisions permis)
  - **Let's Encrypt** : en prod seulement (reverse proxy + certificat TLS automatique)

### Sécurité au niveau conteneur

- **User non-root** dans backend et frontend (`uid 10001`) — réduit l'impact
  d'une RCE applicative.
- **Pas de port exposé non nécessaire** — actuator restreint à `health` + `info`.
- **Variables d'env via `.env`** — secrets jamais en clair dans l'image.

## Sources

- ANSSI — Recommandations sécurisation site web
- UML 2.5 specification (OMG)
- Mermaid — [Sequence Diagram syntax](https://mermaid.js.org/syntax/sequenceDiagram.html)
- Mermaid — [Flowchart syntax](https://mermaid.js.org/syntax/flowchart.html)

---

<small>
*Diagrammes maintenus à jour avec le code. En cas d'évolution majeure
de l'architecture, mettre à jour ici **en premier**, puis le code suit.*
</small>
