import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (loading) return <p className="soft">{t('common.loading')}</p>;
  if (rows.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--sp-6)', textAlign: 'center', fontSize: 'var(--fs-14)', color: 'var(--ink-soft)' }}>
        {t('leaderboard.noEntries')}
      </div>
    );
  }
  return (
    <div className="panel">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>{t('leaderboard.angler')}</th>
            <th>{t('leaderboard.species')}</th>
            <th>{t('leaderboard.size')}</th>
            <th>{t('leaderboard.weight')}</th>
            <th>{t('leaderboard.spot')}</th>
            <th>{t('common.from')}</th>
            <th>{t('leaderboard.date')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.catchDate}-${r.angler}`}>
              <td style={{ fontSize: r.rank <= 3 ? '1.6em' : 'inherit' }}>
                {medalFor(r.rank)}
              </td>
              <td style={{ fontWeight: 500 }}>{r.angler || '—'}</td>
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
  const { t } = useTranslation();

  const { rows, loading } = useMonthlyLeaderboard({
    species: speciesFilter || undefined,
    year,
    month,
    limit: 20,
  });

  return (
    <div className="page">
      <div className="page-container">
        <div style={{ marginBottom: 'var(--sp-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
          <div>
            <div className="eyebrow">{t('leaderboard.title')}</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-44)', fontWeight: 400, letterSpacing: '-0.025em', margin: '0.2em 0' }}>
              {monthLabel(month)} {year}
            </h1>
            <p className="soft" style={{ margin: 0 }}>
              {t('leaderboard.subtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-5)', alignItems: 'flex-end' }}>
          <div className="field" style={{ minWidth: 180 }}>
            <label>{t('leaderboard.filterSpecies')}</label>
            <select className="select" value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)}>
              <option value="">{t('common.all')}</option>
              {speciesList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 140 }}>
            <label>{t('leaderboard.filterMonth')}</label>
            <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 100 }}>
            <label>{t('leaderboard.filterYear')}</label>
            <select className="select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <LeaderboardTable rows={rows} loading={loading} />
      </div>
    </div>
  );
}
