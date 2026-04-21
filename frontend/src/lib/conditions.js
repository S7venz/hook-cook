import { useEffect, useState } from 'react';

/**
 * Conditions du moment pour La Têt près d'Olette (66).
 *
 * Sources :
 *   - Open-Meteo (météo + pression) → gratuit, sans clé, CORS ouvert
 *   - Hubeau (débit rivière temps réel, service public Eaufrance) → idem
 *   - Phase lunaire → calcul local (approximation ±1h, largement suffisant)
 *
 * Station Hubeau retenue : Y0464010 — La Têt à Marquixanes (la plus
 * proche d'Olette avec des observations temps réel fiables).
 *
 * Retombée : si les APIs sont down, on renvoie `error: true` et le
 * composant affiche ses valeurs par défaut (dégradation gracieuse).
 */

const OLETTE_LAT = 42.5553;
const OLETTE_LON = 2.2636;
const HUBEAU_STATION = 'Y0464010';

const METEO_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${OLETTE_LAT}&longitude=${OLETTE_LON}` +
  '&current=temperature_2m,surface_pressure,pressure_msl&timezone=Europe/Paris';

const HUBEAU_URL =
  'https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr' +
  `?code_entite=${HUBEAU_STATION}&grandeur_hydro=Q&size=24&sort=desc`;

function moonPhase(date = new Date()) {
  // Réf: nouvelle lune du 6 janvier 2000 à 18:14 UTC
  const refNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const synodicMonth = 29.530588853;
  const daysSince = (date.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const cyclePos = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth;
  const pct = cyclePos / synodicMonth;

  let label;
  let short;
  if (pct < 0.03 || pct > 0.97) {
    label = 'Nouvelle lune';
    short = 'NL';
  } else if (pct < 0.22) {
    label = 'Premier croissant';
    short = 'L+';
  } else if (pct < 0.28) {
    label = 'Premier quartier';
    short = 'PQ';
  } else if (pct < 0.47) {
    label = 'Gibbeuse croissante';
    short = 'L++';
  } else if (pct < 0.53) {
    label = 'Pleine lune';
    short = 'PL';
  } else if (pct < 0.72) {
    label = 'Gibbeuse décroissante';
    short = 'L--';
  } else if (pct < 0.78) {
    label = 'Dernier quartier';
    short = 'DQ';
  } else {
    label = 'Dernier croissant';
    short = 'L-';
  }

  return { label, short, daysSinceNew: Math.round(cyclePos) };
}

export function useLiveConditions() {
  const [data, setData] = useState({
    temp: null,
    pressure: null,
    flow: null,
    flowHistory: [],
    moon: moonPhase(),
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [meteoRes, hubeauRes] = await Promise.all([
          fetch(METEO_URL).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch(HUBEAU_URL).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (cancelled) return;

        const temp = meteoRes?.current?.temperature_2m ?? null;
        const pressure =
          meteoRes?.current?.pressure_msl ?? meteoRes?.current?.surface_pressure ?? null;
        // Hubeau renvoie "desc" (plus récent en premier). Inverse pour
        // que le sparkline se lise de gauche (ancien) à droite (récent).
        const obs = Array.isArray(hubeauRes?.data) ? hubeauRes.data : [];
        const flowHistory = obs
          .map((o) => (o?.resultat_obs != null ? Number(o.resultat_obs) / 1000 : null))
          .filter((v) => Number.isFinite(v))
          .reverse();
        const flow = flowHistory.length > 0 ? flowHistory[flowHistory.length - 1] : null;

        setData({
          temp,
          pressure,
          flow,
          flowHistory,
          moon: moonPhase(),
          loading: false,
          error: temp === null && flow === null,
        });
      } catch {
        if (!cancelled) {
          setData((d) => ({ ...d, loading: false, error: true }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
