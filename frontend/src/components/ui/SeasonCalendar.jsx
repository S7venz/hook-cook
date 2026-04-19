const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function SeasonCalendar({ months = [], currentMonth = null }) {
  return (
    <div className="season-calendar" role="list" aria-label="Calendrier de saison">
      {MONTH_LABELS.map((label, i) => {
        const month = i + 1;
        const open = months.includes(month);
        const current = currentMonth === month;
        const className = ['month', open && 'open', current && 'current']
          .filter(Boolean)
          .join(' ');
        return (
          <div
            key={month}
            className={className}
            role="listitem"
            aria-label={`Mois ${month}${open ? ' ouvert' : ''}`}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
