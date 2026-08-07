/**
 * Generates formatted unique lead numbers (e.g. LEAD-2026-00042)
 */
export function generateLeadNumber(sequenceVal: number = Math.floor(Math.random() * 90000) + 10000): string {
  const currentYear = new Date().getFullYear();
  const paddedSeq = String(sequenceVal).padStart(5, '0');
  return `LEAD-${currentYear}-${paddedSeq}`;
}
