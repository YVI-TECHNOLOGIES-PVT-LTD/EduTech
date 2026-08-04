import { StudentAcademicRecord } from '../domain/StudentAcademicRecord';
import { supabase } from '../../../config/supabase';

export class AcademicRepository {
    public async findRecords(studentId: string): Promise<StudentAcademicRecord[]> {
        const { data, error } = await supabase
            .from('student_academic_records')
            .select('*')
            .eq('student_id', studentId);

        if (error) throw error;
        return (data || []).map((row: any) => new StudentAcademicRecord(
            row.id,
            row.student_id,
            row.academic_year_id,
            row.grade,
            row.gpa_or_marks,
            row.remarks,
            new Date(row.created_at)
        ));
    }

    public async saveRecord(record: StudentAcademicRecord): Promise<void> {
        const { error } = await supabase
            .from('student_academic_records')
            .upsert({
                id: record.id,
                student_id: record.studentId,
                academic_year_id: record.academicYearId,
                grade: record.grade,
                gpa_or_marks: record.gpaOrMarks,
                remarks: record.remarks
            });

        if (error) throw error;
    }
}
