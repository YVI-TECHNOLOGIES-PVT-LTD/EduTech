export class DateFormatter {
  static formatDate(dateString: string | Date): string {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  static formatDateTime(dateString: string | Date): string {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
