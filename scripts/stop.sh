#!/usr/bin/env bash
#
# Dump l'état courant de la BDD + uploads, puis arrête docker compose.
# À utiliser À LA PLACE de `docker compose down` pour ne jamais perdre
# les données ajoutées pendant la session.
#
# Usage : bash scripts/stop.sh
#

set -e
cd "$(dirname "$0")/.."

bash scripts/dump.sh
echo
echo "→ Arrêt des conteneurs ..."
docker compose down
echo "Stop terminé. `git status --short` pour voir ce qui a changé."
