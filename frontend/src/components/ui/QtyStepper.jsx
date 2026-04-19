export function QtyStepper({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="qty-stepper">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Diminuer la quantité"
      >
        −
      </button>
      <span className="val">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
      >
        +
      </button>
    </div>
  );
}
