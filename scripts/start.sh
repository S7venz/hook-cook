#!/usr/bin/env bash
#
# Construit les images + lance la stack Hook & Cook.
# Si le volume postgres est vide, Postgres applique automatiquement
# postgres/init/01-init.sql au premier boot.
#
# Usage : bash scripts/start.sh
#

set -e
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    echo "!!  Pas de fichier .env. Copie .env.example et renseigne les secrets."
    exit 1
fi

docker compose up --build "$@"
