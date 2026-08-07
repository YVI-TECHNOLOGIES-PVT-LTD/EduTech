/**
 * Generates formatted unique admission numbers (e.g. ADM-2026-00042) for existing admission_no column
 */
export function generateAdmissionNumber(
  sequenceVal: number = Math.floor(Math.random() * 90000) + 10000,
): string {
  const currentYear = new Date().getFullYear();
  const paddedSeq = String(sequenceVal).padStart(5, '0');
  return `ADM-${currentYear}-${paddedSeq}`;
}
