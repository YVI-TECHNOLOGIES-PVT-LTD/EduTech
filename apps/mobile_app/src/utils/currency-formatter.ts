export class CurrencyFormatter {
  static format(amount: number, currency: string = 'USD'): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  }
}
