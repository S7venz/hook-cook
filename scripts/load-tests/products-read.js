/**
 * Test de charge k6 — endpoint catalogue produits
 *
 * Cible : GET /api/products — l'endpoint le plus appelé du site
 * (chargé à l'ouverture de la home + à chaque visite du catalogue).
 *
 * Profil de charge — pyramide commerciale réaliste :
 *  - 30s : montée de 1 → 50 VUs (utilisateurs virtuels)
 *  - 60s : palier à 50 VUs
 *  - 30s : pic à 100 VUs (heure de pointe)
 *  - 30s : descente vers 0
 *
 * Seuils — l'app DOIT répondre à ce SLA :
 *  - p95 < 500 ms (95 % des requêtes en moins d'une demi-seconde)
 *  - taux d'erreur HTTP < 1 %
 *
 * Lancement local :
 *   k6 run --summary-export=audits/k6/products-read-summary.json \
 *     scripts/load-tests/products-read.js
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend } from 'k6/metrics'

const BASE = __ENV.HC_LOAD_BASE || 'http://localhost:8080'

// Métrique custom pour pouvoir tracer la latence métier (hors connexion)
const apiLatency = new Trend('api_products_latency', true)

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
    'api_products_latency': ['p(95)<500'],
  },
  // Tags pour identifier ce scénario dans Grafana / Cloud k6
  tags: {
    project: 'hook-cook',
    scenario: 'products-read',
  },
}

export default function products() {
  const res = http.get(`${BASE}/api/products`, {
    tags: { name: 'GET /api/products' },
  })
  apiLatency.add(res.timings.duration)

  check(res, {
    'HTTP 200': (r) => r.status === 200,
    'body non vide': (r) => r.body && r.body.length > 100,
    'JSON valide': (r) => {
      try {
        const arr = JSON.parse(r.body)
        return Array.isArray(arr) && arr.length > 0
      } catch {
        return false
      }
    },
  })

  // Pause réaliste entre 2 requêtes d'un utilisateur — pas de hammer
  sleep(Math.random() * 2 + 1)
}
