import { useState } from 'react';
import { monthLabel, useMonthlyLeaderboard } from '../lib/leaderboard.js';
import { useReferenceData } from '../lib/referenceData.js';

const CURRENT_DATE = new Date();

function medalFor(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}

function LeaderboardTable({ rows, loading }) {
  if (loading) return <p className="soft">Chargement du classement…</p>;
  if (rows.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 'var(--sp-6)',
          textAlign: 'center',
          fontSize: 'var(--fs-14)',
          color: 'var(--ink-soft)',
        }}
      >
        Aucune prise enregistrée ce mois. Soyez le premier à ouvrir le classement.
      </div>
    );
  }
  return (
    <div className="panel">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Pêcheur</th>
            <th>Espèce</th>
            <th>Taille</th>
            <th>Poids</th>
            <th>Spot</th>
            <th>Appât</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.catchDate}-${r.angler}`}>
              <td style={{ fontSize: r.rank <= 3 ? '1.6em' : 'inherit' }}>
                {medalFor(r.rank)}
              </td>
              <td style={{ fontWeight: 500 }}>{r.angler || 'Anonyme'}</td>
              <td style={{ textTransform: 'capitalize' }}>{r.species}</td>
              <td className="mono">{r.taille} cm</td>
              <td className="mono soft">{r.poids ? `${r.poids} g` : '—'}</td>
              <td>{r.spot || '—'}</td>
              <td className="soft">{r.bait || '—'}</td>
              <td className="mono soft">{r.catchDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeaderboardPage() {
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [year, setYear] = useState(CURRENT_DATE.getFullYear());
  const [month, setMonth] = useState(CURRENT_DATE.getMonth() + 1);
  const { species: speciesList } = useReferenceData();

  const { rows, loading } = useMonthlyLeaderboard({
    species: speciesFilter || undefined,
    year,
    month,
    limit: 20,
  });

  const speciesLabel = speciesFilter
    ? speciesList.find((s) => s.id === speciesFilter)?.name ?? speciesFilter
    : 'toutes espèces';

  return (
    <div className="page">
      <div className="page-container">
        <div
          style={{
            marginBottom: 'var(--sp-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)',
          }}
        >
          <div>
            <div className="eyebrow">Challenge du mois</div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-44)',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                margin: '0.2em 0',
              }}
            >
              Plus grosse prise — {monthLabel(month)} {year}
            </h1>
            <p className="soft" style={{ margin: 0 }}>
              Classement par taille des prises consignées dans le carnet communautaire,{' '}
              {speciesLabel}.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-3)',
            flexWrap: 'wrap',
            marginBottom: 'var(--sp-5)',
            alignItems: 'flex-end',
          }}
        >
          <div className="field" style={{ minWidth: 180 }}>
            <label>Espèce</label>
            <select
              className="select"
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
            >
              <option value="">Toutes espèces</option>
              {speciesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 140 }}>
            <label>Mois</label>
            <select
              className="select"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 100 }}>
            <label>Année</label>
            <select
              className="select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <LeaderboardTable rows={rows} loading={loading} />

        <div
          className="soft"
          style={{
            marginTop: 'var(--sp-6)',
            fontSize: 'var(--fs-13)',
            textAlign: 'center',
          }}
        >
          Les trois premiers reçoivent un bon d'achat Hook & Cook. Les prises sont
          agrégées depuis les carnets utilisateurs.
        </div>
      </div>
    </div>
  );
}
