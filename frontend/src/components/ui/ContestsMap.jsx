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

// Épingle personnalisée dans la palette du projet, sans dépendre des
// PNG par défaut de Leaflet (qui posent des problèmes de bundling).
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

// Tiles libres — sans clé, adaptées au thème
const TILES_LIGHT = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap',
};
const TILES_DARK = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap · &copy; CARTO',
};

export function ContestsMap({ contests = [] }) {
  const { theme } = useTheme();
  const tiles = theme === 'dark' ? TILES_DARK : TILES_LIGHT;
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

  // Hack pour forcer le re-render du TileLayer quand le thème change
  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, [theme]);

  return (
    <div className="contests-map">
      <MapContainer
        center={center}
        zoom={9}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%', borderRadius: 'var(--r-md)' }}
      >
        <TileLayer key={renderKey} url={tiles.url} attribution={tiles.attribution} />
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
        Carte des concours — région Occitanie · {pins.length} épingle{pins.length > 1 ? 's' : ''}
      </div>
    </div>
  );
}
