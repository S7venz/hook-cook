# Scripts utilitaires

Helpers pour ne pas perdre de données entre sessions et garder le dump du repo à jour.

| Script | Utilité |
|---|---|
| [`start.sh`](start.sh) | `docker compose up --build` (vérifie que `.env` existe) |
| [`stop.sh`](stop.sh) | Dump la BDD + sync les uploads → arrête les conteneurs |
| [`dump.sh`](dump.sh) | Dump sans arrêter les conteneurs (à lancer avant un commit par exemple) |
| [`reset.sh`](reset.sh) | Reset complet (vide les volumes, repart du dump du repo) |

## Usage typique

```bash
# Lancer la stack
bash scripts/start.sh

# Travailler normalement... ajouter des produits via /admin, faire des commandes, etc.

# En fin de session, stocker l'état courant dans le repo :
bash scripts/stop.sh

# Vérifier ce qui a changé avant commit :
git status
```

## Sous Windows

Ces scripts utilisent bash — exécute-les via **Git Bash** (installé avec Git for Windows) ou WSL. Depuis PowerShell :

```powershell
bash scripts/start.sh
bash scripts/stop.sh
```

## Fichiers produits par le dump

- `postgres/init/01-init.sql` — dump Postgres complet (schema + data)
- `backend/uploads/` — images servies par le backend (`GET /api/uploads/<file>`)

Ces deux éléments sont commités. Le correcteur qui clone puis `bash scripts/start.sh` obtient exactement le même état que toi au dernier dump.
