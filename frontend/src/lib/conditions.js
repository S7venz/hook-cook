import { useEffect, useState } from 'react';

/**
 * Conditions du moment pour La Têt près d'Olette (66).
 *
 * Sources :
 *   - Open-Meteo (météo + pression) → gratuit, sans clé, CORS ouvert
 *   - Phase lunaire → calcul local (approximation ±1h, largement suffisant)
 *
 * Retombée : si l'API est down, on renvoie `error: true` et le composant
 * affiche ses valeurs par défaut (dégradation gracieuse).
 */

const OLETTE_LAT = 42.5553;
const OLETTE_LON = 2.2636;

const METEO_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${OLETTE_LAT}&longitude=${OLETTE_LON}` +
  '&current=temperature_2m,surface_pressure,pressure_msl&timezone=Europe/Paris';

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
    moon: moonPhase(),
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const silentFetch = (url) =>
          fetch(url)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null);

        const meteoRes = await silentFetch(METEO_URL);
        if (cancelled) return;

        const temp = meteoRes?.current?.temperature_2m ?? null;
        const pressure =
          meteoRes?.current?.pressure_msl ?? meteoRes?.current?.surface_pressure ?? null;

        setData({
          temp,
          pressure,
          moon: moonPhase(),
          loading: false,
          error: temp === null,
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
