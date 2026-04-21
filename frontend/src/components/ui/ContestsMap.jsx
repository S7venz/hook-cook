import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../lib/theme.js';

// Coordonnées des lieux de concours connus (approximatives, centre-lieu)
const CONTEST_COORDS = {
  'vesoul-2026-05':  { lat: 42.5553, lng: 2.2636, hint: 'Olette (66) — Vallée de la Têt' },
  'saone-2026-06':   { lat: 42.6362, lng: 2.5120, hint: 'Lac de Vinça (66)' },
  'doubs-2026-03':   { lat: 42.4081, lng: 2.4817, hint: 'Prats-de-Mollo (66) — Le Tech' },
  'etang-carpe-nuit':{ lat: 42.7705, lng: 2.8727, hint: "Rivesaltes (66) — L'Agly" },
};

// Épingle personnalisée dans la palette du projet.
function buildIcon(accent = '#B15E2F') {
  return L.divIcon({
    className: 'contests-map-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
    html: `
      <svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2a8 8 0 0 0-8 8c0 5.5 8 12 8 12s8-6.5 8-12a8 8 0 0 0-8-8z"
              fill="${accent}" stroke="#14233F" stroke-width="1"/>
        <circle cx="12" cy="10" r="3" fill="#F5F1E6"/>
      </svg>
    `,
  });
}

/**
 * Tiles OSM France — mêmes données qu'OpenStreetMap mais rendues avec
 * les noms de lieux en français (Occitanie au lieu d'Occitania, etc.).
 * Pas de clé API, gratuit. Attribution toujours requise (ODbL) — on
 * l'affiche dans notre caption custom plutôt que dans le contrôle
 * Leaflet par défaut.
 *
 * Dark mode : on applique un filter CSS invert+hue-rotate sur les
 * tiles plutôt que de switcher de provider (CARTO dark est en
 * anglais, et il n'existe pas de provider dark gratuit en français).
 */
const TILE_URL = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';

export function ContestsMap({ contests = [] }) {
  const { theme } = useTheme();
  const icon = useMemo(() => buildIcon(), []);

  // Ne garde que les concours qu'on sait placer sur la carte
  const pins = contests
    .map((c) => ({ ...c, coords: CONTEST_COORDS[c.id] }))
    .filter((c) => c.coords);

  // Centre : moyenne des pins ou centre des P-O par défaut
  const center = pins.length
    ? [
        pins.reduce((s, p) => s + p.coords.lat, 0) / pins.length,
        pins.reduce((s, p) => s + p.coords.lng, 0) / pins.length,
      ]
    : [42.65, 2.55];

  // Force un re-render quand le thème change (réapplique la classe filter)
  const [, setRenderKey] = useState(0);
  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, [theme]);

  return (
    <div className={`contests-map theme-${theme}`}>
      <MapContainer
        center={center}
        zoom={9}
        scrollWheelZoom={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', borderRadius: 'var(--r-md)' }}
      >
        <TileLayer url={TILE_URL} />
        {pins.map((p) => (
          <Marker key={p.id} position={[p.coords.lat, p.coords.lng]} icon={icon}>
            <Popup>
              <strong>{p.title}</strong>
              <br />
              <span style={{ color: '#5a6478', fontSize: 12 }}>{p.coords.hint}</span>
              <br />
              {p.dateDisplay} · {p.format}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="contests-map-caption">
        {pins.length} concours en Occitanie · © OSM France
      </div>
    </div>
  );
}
