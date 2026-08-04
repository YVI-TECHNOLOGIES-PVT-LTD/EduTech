import { supabase } from '../../../../../config/supabase';

export class AcademicProvisioner {
    public async provision(studentId: string, grade: string, academicYearId: string): Promise<void> {
        // Inserts student sections allocations
        const { error } = await supabase
            .from('student_academic_enrollment')
            .insert({
                student_id: studentId,
                grade: grade,
                academic_year_id: academicYearId,
                status: 'Active',
                roll_number: Math.floor(Math.random() * 50) + 1
            });

        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
