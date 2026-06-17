#!/usr/bin/env bash
#
# Sauvegarde horodatée de la base PostgreSQL (pg_dump compressé) avec rétention.
# Destinée à être planifiée en production (cron quotidien à 3h) :
#   0 3 * * * cd /chemin/hook-cook && bash scripts/backup.sh >> /var/log/hookcook-backup.log 2>&1
#
# Usage : bash scripts/backup.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

PG_CONTAINER="${PG_CONTAINER:-hook-cook-postgres-1}"
PG_USER="${POSTGRES_USER:-hookcook}"
PG_DB="${POSTGRES_DB:-hookcook}"
BACKUP_DIR="backups"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +%Y-%m-%d-%Hh%M)"
OUT="${BACKUP_DIR}/dump-${STAMP}.sql.gz"

if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    echo "!!  Conteneur ${PG_CONTAINER} non trouvé — sauvegarde impossible." >&2
    exit 1
fi

mkdir -p "${BACKUP_DIR}"
echo "→ Sauvegarde de ${PG_DB} ..."
docker exec "${PG_CONTAINER}" pg_dump -U "${PG_USER}" -d "${PG_DB}" --clean --if-exists \
    | gzip -9 > "${OUT}"

SIZE="$(du -h "${OUT}" | cut -f1)"
echo "   → ${OUT} (${SIZE})"

# Rétention : purge des sauvegardes de plus de RETENTION_DAYS jours.
find "${BACKUP_DIR}" -name 'dump-*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
KEPT="$(find "${BACKUP_DIR}" -name 'dump-*.sql.gz' -type f | wc -l | tr -d ' ')"
echo "Sauvegarde terminée (${KEPT} fichier(s) conservé(s), rétention ${RETENTION_DAYS} j)."
