/**
 * Generates formatted unique application numbers (e.g. APP-2026-00042) for existing application_number column
 */
export function generateApplicationNumber(sequenceVal: number = Math.floor(Math.random() * 90000) + 10000): string {
  const currentYear = new Date().getFullYear();
  const paddedSeq = String(sequenceVal).padStart(5, '0');
  return `APP-${currentYear}-${paddedSeq}`;
}
