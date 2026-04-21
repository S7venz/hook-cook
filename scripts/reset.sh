#!/usr/bin/env bash
#
# Réinitialise complètement la stack à l'état du dump git.
# Supprime les volumes Postgres + uploads, puis relance les conteneurs
# qui vont re-seeder depuis postgres/init/01-init.sql.
#
# ⚠️  Cela efface toutes les données ajoutées depuis le dernier dump
# (users, commandes, permis, carnet, etc.)
#
# Usage : bash scripts/reset.sh
#

set -e
cd "$(dirname "$0")/.."

echo "⚠️  Ce script va :"
echo "   - supprimer les volumes pgdata + uploads"
echo "   - relancer les conteneurs en repartant du dump seed"
echo
read -p "Continuer ? [oN] " answer
[[ "$answer" == [oOyY] ]] || { echo "Annulé."; exit 0; }

docker compose down -v
docker compose up --build
