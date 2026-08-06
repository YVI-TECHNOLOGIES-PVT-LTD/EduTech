import { ReportDefinition } from '../contracts/reporting.contracts';

export class ReportRegistry {
  private static reports = new Map<string, ReportDefinition>([
    [
      'student_enrollment_summary',
      {
        key: 'student_enrollment_summary',
        title: 'Student Enrollment Summary',
        description: 'Total student enrollment summary grouped by academic year and program',
        columns: [
          { key: 'academicYear', label: 'Academic Year', type: 'string' },
          { key: 'program', label: 'Program Name', type: 'string' },
          { key: 'totalEnrolled', label: 'Total Enrolled', type: 'number' },
        ],
      },
    ],
    [
      'fee_collection_report',
      {
        key: 'fee_collection_report',
        title: 'Fee Collection Summary Report',
        description: 'Daily and monthly fee collections',
        columns: [
          { key: 'date', label: 'Collection Date', type: 'date' },
          { key: 'amount', label: 'Total Amount', type: 'number' },
          { key: 'paymentMethod', label: 'Payment Method', type: 'string' },
        ],
      },
    ],
  ]);

  public static register(def: ReportDefinition): void {
    this.reports.set(def.key, def);
  }

  public static get(key: string): ReportDefinition | undefined {
    return this.reports.get(key);
  }
}
