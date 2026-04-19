const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

export function formatPrice(value) {
  return priceFormatter.format(value);
}
