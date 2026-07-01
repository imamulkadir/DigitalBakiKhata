// Format amounts as Bengali numerals with ৳ symbol
const bnFormatter = new Intl.NumberFormat('bn-BD', {
  style: 'currency',
  currency: 'BDT',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return bnFormatter.format(Math.abs(amount));
}

export function formatAmount(amount: number): string {
  // Returns Bengali numeral representation e.g. "১,২৫০"
  return new Intl.NumberFormat('bn-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
