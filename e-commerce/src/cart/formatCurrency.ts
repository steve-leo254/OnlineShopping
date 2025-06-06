const CURRENCY_FORMATTER = new Intl.NumberFormat('en-KE', {
  currency: 'KES',
  style: 'currency',
  currencyDisplay: 'symbol',
  minimumFractionDigits: 0, // Adjust decimal places if needed
  maximumFractionDigits: 0,
});

export function formatCurrency(number: number) {
  // Format the number and replace the default "KSh" or "KSH" with "Ksh"
  return CURRENCY_FORMATTER.format(number).replace(/KSh|KSH/, 'Ksh');
}