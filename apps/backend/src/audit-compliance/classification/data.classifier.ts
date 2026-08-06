export type DataSensitivityLevel =
  'Public' | 'Internal' | 'Confidential' | 'Sensitive' | 'HighlySensitive';

export class DataClassifier {
  public static classify(field: string): DataSensitivityLevel {
    const lower = field.toLowerCase();
    if (lower.includes('password') || lower.includes('ssn') || lower.includes('secret'))
      return 'HighlySensitive';
    if (lower.includes('email') || lower.includes('phone') || lower.includes('address'))
      return 'Sensitive';
    if (lower.includes('fee') || lower.includes('grade') || lower.includes('salary'))
      return 'Confidential';
    if (lower.includes('role') || lower.includes('department')) return 'Internal';
    return 'Public';
  }
}
