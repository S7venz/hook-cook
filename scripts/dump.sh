#!/usr/bin/env bash
#
# Exporte l'état actuel de Postgres + uploads dans les fichiers de seed du repo.
# À lancer avant de committer (ou automatiquement via scripts/stop.sh).
#
# Usage : bash scripts/dump.sh
#

set -e
cd "$(dirname "$0")/.."

PG_CONTAINER="hook-cook-postgres-1"
BACKEND_CONTAINER="hook-cook-backend-1"
SQL_FILE="postgres/init/01-init.sql"
UPLOADS_DIR="backend/uploads"

if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
    echo "!!  Conteneur $PG_CONTAINER non trouvé — impossible de dumper."
    exit 1
fi

echo "→ Dump Postgres ..."
mkdir -p "$(dirname "$SQL_FILE")"
TMP=$(mktemp)
docker exec "$PG_CONTAINER" pg_dump -U hookcook -d hookcook --inserts --clean --if-exists \
    | sed '/^\\restrict /d; /^\\unrestrict /d' > "$TMP"

{
    echo "-- Hook & Cook seed dump"
    echo "-- Régénéré automatiquement par scripts/dump.sh"
    echo "-- $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo
    cat "$TMP"
} > "$SQL_FILE"

rm -f "$TMP"
LINES=$(wc -l < "$SQL_FILE" | tr -d ' ')
PRODUCTS=$(grep -c "INSERT INTO public.products" "$SQL_FILE" || true)
ORDERS=$(grep -c "INSERT INTO public.orders" "$SQL_FILE" || true)
PERMITS=$(grep -c "INSERT INTO public.permits" "$SQL_FILE" || true)
echo "   → $SQL_FILE ($LINES lignes, $PRODUCTS produits, $ORDERS commandes, $PERMITS permis)"

if docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
    echo "→ Sync images uploadées ..."
    mkdir -p "$UPLOADS_DIR"
    docker cp "${BACKEND_CONTAINER}:/app/uploads/." "$UPLOADS_DIR/" 2>/dev/null || true
    COUNT=$(ls "$UPLOADS_DIR" 2>/dev/null | wc -l | tr -d ' ')
    echo "   → $UPLOADS_DIR ($COUNT fichiers)"
else
    echo "!!  Conteneur $BACKEND_CONTAINER non actif — uploads non synchronisés."
fi

echo "Dump terminé."
