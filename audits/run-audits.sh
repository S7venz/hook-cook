#!/usr/bin/env bash
# Lance les audits Lighthouse + Pa11y sur les pages clés de Hook & Cook.
# Pré-requis : docker compose up (frontend sur :5173 + backend sur :8080).
# Usage : ./audits/run-audits.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${HC_AUDIT_BASE:-http://localhost:5173}"
OUT_LH="audits/lighthouse"
OUT_PA="audits/pa11y"
mkdir -p "$OUT_LH" "$OUT_PA"

# Chrome non installé sur la machine de dev : on utilise Brave (Chromium-based).
# Le binaire est résolu automatiquement si CHROME_PATH est exporté.
if [[ -z "${CHROME_PATH:-}" ]]; then
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" ; do
    if [[ -x "$candidate" ]]; then
      export CHROME_PATH="$candidate"
      echo "Chrome détecté : $candidate"
      break
    fi
  done
fi

# Pages auditées : URL → slug
declare -a PAGES=(
  "/|home"
  "/boutique|boutique"
  "/permis|permis"
  "/connexion|connexion"
  "/concours|concours"
)

echo "== Lighthouse ($BASE) =="
for entry in "${PAGES[@]}"; do
  url="${entry%%|*}"
  slug="${entry##*|}"
  full="${BASE}${url}"
  echo "  → $slug ($full)"
  lighthouse "$full" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output=html \
    --output-path="$OUT_LH/$slug" \
    --max-wait-for-load=45000 || echo "    (lighthouse $slug a échoué)"
done

echo ""
echo "== Pa11y axe-core ($BASE) =="
for entry in "${PAGES[@]}"; do
  url="${entry%%|*}"
  slug="${entry##*|}"
  full="${BASE}${url}"
  echo "  → $slug ($full)"
  pa11y "$full" \
    --runner axe \
    --standard WCAG2AA \
    --reporter json \
    > "$OUT_PA/$slug.json" 2>/dev/null || echo "    (pa11y $slug : erreurs ou page lente)"
done

echo ""
echo "Rapports :"
ls -la "$OUT_LH" "$OUT_PA"
