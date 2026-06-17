#!/usr/bin/env bash
#
# Restaure une sauvegarde PostgreSQL (.sql.gz produit par scripts/backup.sh).
# Par défaut, restaure dans une base de VÉRIFICATION distincte
# (hookcook_restore_check) pour tester la restauration SANS écraser la
# production. Utiliser --into <base> pour cibler une autre base (ex. reprise
# réelle après incident).
#
# Usage :
#   bash scripts/restore.sh backups/dump-2026-06-17-14h30.sql.gz
#   bash scripts/restore.sh backups/dump-....sql.gz --into hookcook
#
set -euo pipefail
cd "$(dirname "$0")/.."

DUMP="${1:?Usage : bash scripts/restore.sh <fichier.sql.gz> [--into <base>]}"
TARGET_DB="hookcook_restore_check"
if [[ "${2:-}" == "--into" && -n "${3:-}" ]]; then
    TARGET_DB="$3"
fi

PG_CONTAINER="${PG_CONTAINER:-hook-cook-postgres-1}"
PG_USER="${POSTGRES_USER:-hookcook}"

if [[ ! -f "${DUMP}" ]]; then
    echo "!!  Fichier ${DUMP} introuvable." >&2
    exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    echo "!!  Conteneur ${PG_CONTAINER} non trouvé." >&2
    exit 1
fi

echo "→ (Re)création de la base cible ${TARGET_DB} ..."
docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d postgres -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS ${TARGET_DB};" \
    -c "CREATE DATABASE ${TARGET_DB} OWNER ${PG_USER};"

echo "→ Restauration de ${DUMP} dans ${TARGET_DB} ..."
gunzip -c "${DUMP}" | docker exec -i "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${TARGET_DB}" -q

echo "→ Vérification (comptes de lignes dans la base restaurée) :"
docker exec "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${TARGET_DB}" -At -F ' = ' \
    -c "SELECT 'users', count(*) FROM users
        UNION ALL SELECT 'products', count(*) FROM products
        UNION ALL SELECT 'orders', count(*) FROM orders
        UNION ALL SELECT 'permits', count(*) FROM permits;"

echo "Restauration terminée et vérifiée."
