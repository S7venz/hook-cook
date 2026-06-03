---
tags:
  - Déploiement
  - DevOps
  - CP10
  - CP11
---

# Déploiement

!!! abstract "Objectif"
    Procédure complète de déploiement de Hook & Cook : environnements,
    pré-requis serveur, mise en service initiale, mises à jour (release),
    rollback, maintenance.

## 1. Environnements

| Environnement | URL | Données | Stripe | Usage |
|---|---|---|---|---|
| **DEV** local | `http://localhost:5173` | Seed démo (`HC_SEED_DEMO=true`) | Mode mock OU clé test | Développement quotidien |
| **CI** ephemeral | jobs GitHub Actions | H2 in-memory + Postgres temp | Mock | Tests automatiques sur chaque PR |
| **UAT** local | `http://localhost:5173` via `docker compose up` | Seed démo | Mode test (`pk_test_...`) | Recette utilisateur, soutenance |
| **PROD** | `https://hookcook.fr` (à déployer) | Réelles | Mode live (`pk_live_...`) | Mise en service finale |

## 2. Pré-requis serveur (PROD)

### Matériel minimum recommandé

| Ressource | Minimum | Recommandé |
|---|---|---|
| **vCPU** | 2 | 4 |
| **RAM** | 4 GB | 8 GB |
| **Disque** | 40 GB SSD | 80 GB SSD |
| **Bande passante** | 100 Mbps | 1 Gbps |

Hébergeurs envisagés (par ordre de préférence pour le projet de fin d'année) :
**Hetzner CPX21** (~5 €/mois), **Scaleway DEV1-M**, **Vultr Cloud Compute**.

### OS et logiciels de base

- **OS** : Debian 12 stable ou Ubuntu Server 24.04 LTS
- **Docker Engine** : ≥ 24.0
- **Docker Compose plugin** : ≥ 2.20
- **git** : ≥ 2.40 (pour clone + futures mises à jour)
- **curl**, **bash** : standard

### Comptes externes à provisionner

| Service | Pourquoi | Coût |
|---|---|---|
| **Nom de domaine** (`hookcook.fr`) | URL de production | ~12 €/an chez OVH/Gandi |
| **Stripe** compte live | Paiements réels | 1,4 % + 0,25 € par transaction CB FR |
| **SMTP** (Gmail SMTP relay, Mailgun, ou SES) | Envoi emails transactionnels | Gratuit jusqu'à ~3 000 mails/mois |
| **GitHub Container Registry** (gratuit privé) ou Docker Hub | Stocker images Docker | Gratuit |

## 3. Première mise en service

### Étape 1 — Provisionner le serveur

```bash
# Création VM via interface hébergeur (Debian 12)
# Récupérer l'IP publique : exemple 5.196.x.x

# Connexion SSH initiale
ssh root@5.196.x.x

# Créer un user non-root pour l'app
adduser hookcook
usermod -aG sudo hookcook
usermod -aG docker hookcook

# Désactiver le login root SSH
sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl reload sshd

# Mises à jour système
apt update && apt upgrade -y

# Firewall basique (UFW)
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp           # SSH
ufw allow 80/tcp           # HTTP (Let's Encrypt + redirection)
ufw allow 443/tcp          # HTTPS
ufw enable
```

### Étape 2 — Installer Docker

```bash
# Procédure officielle Docker pour Debian
curl -fsSL https://get.docker.com | sudo sh

# Vérifier
docker --version       # ≥ 24.0
docker compose version # ≥ 2.20
```

### Étape 3 — DNS

Sur le panneau de contrôle du registrar :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| `A` | `@` (hookcook.fr) | IP publique du serveur | 3600 |
| `A` | `www` | IP publique du serveur | 3600 |
| `MX` | `@` | (selon SMTP) | 3600 |
| `TXT` | `@` | `v=spf1 include:...` (SPF pour SMTP) | 3600 |

Attendre la propagation DNS (~15 min — 4h selon registrar). Vérifier :

```bash
dig +short hookcook.fr A
# → doit retourner l'IP du serveur
```

### Étape 4 — Cloner le projet

```bash
su hookcook
cd ~
git clone https://github.com/S7venz/hook-cook.git
cd hook-cook
```

### Étape 5 — Configuration des secrets `.env`

```bash
cp .env.example .env
nano .env
```

**Variables à modifier en PROD** (générer des secrets forts) :

```bash
# Postgres — JAMAIS le défaut en prod
POSTGRES_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# JWT — 64 chars minimum
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

# Admin seed
ADMIN_EMAIL=admin@hookcook.fr
ADMIN_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(16))")
# → noter ce mot de passe dans un coffre-fort (1Password, Bitwarden)

# Redis
REDIS_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# SMTP réel (exemple Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=noreply.hookcook@gmail.com
SMTP_PASSWORD=xxxxxxxxxxxxxxxx     # App password Google, pas le vrai mdp
SMTP_FROM=no-reply@hookcook.fr

# Stripe LIVE — récupéré depuis dashboard.stripe.com
STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx
STRIPE_CURRENCY=eur

# Frontend URLs publiques
VITE_API_URL=https://hookcook.fr/api
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxx
HC_FRONTEND_URL=https://hookcook.fr

# Pas de seed démo en prod !
HC_SEED_DEMO=
```

**Sécuriser le fichier `.env`** :

```bash
chmod 600 .env
chown hookcook:hookcook .env
```

### Étape 6 — Reverse proxy + TLS Let's Encrypt

On utilise **Caddy** (auto-renewal Let's Encrypt out-of-the-box) comme reverse
proxy devant le frontend dockerisé.

```bash
sudo apt install -y caddy
```

Fichier `/etc/caddy/Caddyfile` :

```
hookcook.fr {
    encode gzip zstd
    reverse_proxy 127.0.0.1:5173

    # Headers de sécurité supplémentaires
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Cache long sur les assets hashés
    @assets {
        path /assets/*
    }
    header @assets Cache-Control "public, max-age=31536000, immutable"

    # Logs
    log {
        output file /var/log/caddy/hookcook.log
        format json
        level INFO
    }
}

www.hookcook.fr {
    redir https://hookcook.fr{uri} permanent
}
```

Activer + démarrer :

```bash
sudo systemctl reload caddy
sudo systemctl enable caddy
# Caddy s'occupe automatiquement de Let's Encrypt
```

Vérifier que le certificat est émis (peut prendre 1-2 min) :

```bash
curl -I https://hookcook.fr
# → doit retourner 200 ou 502 (502 si backend pas encore up)
```

### Étape 7 — Premier démarrage de la stack

```bash
cd ~/hook-cook
bash scripts/start.sh
# (équivalent à docker compose up -d --build)

# Suivre le boot
docker compose logs -f
# Attendre que les 4 services soient healthy
docker compose ps
```

Vérifications :

```bash
# Backend healthy
curl https://hookcook.fr/api/products
# → JSON avec produits seedés

# Frontend accessible
curl -I https://hookcook.fr/
# → 200 OK

# Connexion admin (utiliser ADMIN_EMAIL/ADMIN_PASSWORD du .env)
# Via le navigateur sur https://hookcook.fr/connexion
```

### Étape 8 — Configurer le webhook Stripe

Dans le **dashboard Stripe** → *Developers* → *Webhooks* → *Add endpoint* :

- **URL** : `https://hookcook.fr/api/payments/webhook`
- **Events** : `payment_intent.succeeded`, `payment_intent.payment_failed`
- Récupérer le **Signing secret** (`whsec_xxx`) et le mettre dans `.env` côté serveur :
  ```bash
  sed -i 's/^STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx/' .env
  docker compose restart backend
  ```

Tester avec un paiement réel sur un produit de test (1 €). Le webhook doit
être reçu en < 5s et la commande passer en `paid`.

## 4. Procédure de mise à jour (release)

À chaque release sur la branche `main` :

```bash
# Sur le serveur
ssh hookcook@hookcook.fr
cd ~/hook-cook

# 1. Snapshot BDD avant déploiement (rollback safety net)
bash scripts/dump.sh

# 2. Récupérer le code
git fetch origin
git log HEAD..origin/main --oneline   # voir ce qui va être déployé
git pull --ff-only origin main

# 3. Rebuild + redémarrer (zero-downtime quasi grâce aux healthchecks)
docker compose up -d --build

# 4. Suivre le boot
docker compose logs -f --tail=50 backend

# 5. Vérification fonctionnelle
curl -fsS https://hookcook.fr/api/products | jq 'length'
curl -fsS https://hookcook.fr/actuator/health | jq

# 6. Vérifier que le webhook Stripe répond toujours
stripe trigger payment_intent.succeeded
# → vérifier dans les logs backend que l'event est bien reçu
```

**Temps de déploiement attendu** : 3-5 min (build Gradle + npm + healthchecks).

## 5. Rollback

En cas de bug critique détecté après déploiement :

```bash
# Variante 1 : retour à la version précédente
cd ~/hook-cook
git log --oneline | head -10           # repérer le SHA précédent
git checkout <SHA-précédent>
docker compose up -d --build

# Variante 2 : si la BDD a été migrée, restaurer le dump
gunzip -c backups/dump-2026-05-13-14h30.sql.gz | \
  docker exec -i hookcook-postgres-1 psql -U hookcook -d hookcook
```

**Important** : si le rollback nécessite de redescendre le schéma BDD (rare
avec Hibernate `dbCreate: update`), il faut migrer les données manuellement
ou accepter une perte d'historique récent.

## 6. Maintenance

### Backups automatiques

Cron quotidien à 3h du matin :

```bash
crontab -e
# Ajouter :
0 3 * * * cd /home/hookcook/hook-cook && bash scripts/dump.sh > /tmp/backup-cron.log 2>&1
```

Le script `scripts/dump.sh` produit un `pg_dump` + zip du dossier `uploads/`.

**Rétention** : 30 jours en local, sauvegarde hebdo poussée vers S3/Backblaze
B2 (à configurer séparément).

### Surveillance

| Métrique | Outil | Seuil d'alerte |
|---|---|---|
| Disponibilité HTTP | UptimeRobot (gratuit) | < 99,5 % sur 30 j |
| Espace disque | `df -h` cron quotidien | > 80 % |
| Logs erreurs backend | `docker compose logs backend \| grep ERROR` | À surveiller |
| Latence p95 catalogue | k6 cron hebdo | > 500 ms |
| CVE des dépendances | Dependabot GitHub | Toute alerte high |

### Mises à jour de sécurité OS

```bash
# Cron mensuel sur le serveur
sudo unattended-upgrades --debug
```

Pour Debian, le paquet `unattended-upgrades` applique automatiquement les
patches de sécurité critique de l'OS.

### Renouvellement du certificat TLS

**Automatique avec Caddy** — pas d'action manuelle requise. Renouvellement
quand il reste 30 jours sur le certificat actuel.

## 7. Procédure de tests d'intégration sur l'environnement déployé

Une fois en prod, exécuter la suite Playwright contre l'URL de prod pour
valider que le déploiement n'a rien cassé :

```bash
# Sur la machine de dev (pas le serveur prod)
cd frontend
HC_E2E_BASE=https://hookcook.fr npx playwright test
```

**Critères d'acceptation post-déploiement** :

- [x] `/` répond 200 et affiche la home
- [x] `/api/products` répond avec ≥ 1 produit
- [x] Login admin fonctionne
- [x] Lighthouse Performance ≥ 80 sur la home
- [x] Webhook Stripe `payment_intent.succeeded` test reçu en < 5s

## 8. Étapes de bascule mode test → mode live Stripe

À ne faire qu'au moment de la **vraie mise en service** :

1. Compte Stripe **activé** (KYC validé par Stripe — peut prendre 2-3 jours)
2. Récupérer les **clés `pk_live_*` et `sk_live_*`** dans le dashboard
3. Créer un **nouveau endpoint webhook** en mode live avec son propre
   `whsec_*` (les webhooks test et live sont séparés)
4. Mettre à jour `.env` :
   ```bash
   STRIPE_PUBLIC_KEY=pk_live_xxx
   STRIPE_SECRET_KEY=sk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx_LIVE
   VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
   ```
5. **Rebuild frontend** (la clé publique est compilée au build) :
   ```bash
   docker compose up -d --build frontend
   ```
6. Tester avec **un vrai paiement de 1 €** sur son propre compte bancaire.
7. Vérifier l'arrivée dans le dashboard Stripe live + l'email de
   confirmation client.

## 9. Désactivation / mise hors service

Procédure d'arrêt propre (ex. fin de période de démo, migration vers autre
hébergeur) :

```bash
# 1. Backup final
cd ~/hook-cook
bash scripts/dump.sh

# 2. Annoncer la fermeture (mode lecture seule possible — non implémenté)
# Mettre une bannière "Service en maintenance" dans index.html

# 3. Stopper les services
docker compose down

# 4. Archiver les données
tar -czf hookcook-final-$(date +%F).tar.gz \
    backups/ backend/uploads/ .env

# 5. Garder ce fichier en lieu sûr 10 ans (obligation comptable)

# 6. Retirer DNS et résilier le serveur si applicable
```

## Références

- ANSSI — [Recommandations pour la sécurisation des sites web](https://www.ssi.gouv.fr/uploads/IMG/pdf/NP_Securite_Web_NoteTech.pdf)
- Caddy Server — [Documentation officielle](https://caddyserver.com/docs/)
- Docker Compose — [Healthchecks reference](https://docs.docker.com/reference/compose-file/services/#healthcheck)
- Stripe — [Going live checklist](https://stripe.com/docs/development/checklist)
- Let's Encrypt — [Rate limits](https://letsencrypt.org/docs/rate-limits/)

---

<small>
*Dernière revue : 2026-05-13. À ré-éditer après la première vraie mise
en production.*
</small>
