import { StudentAllocation } from '../domain/StudentAllocation';
import { supabase } from '../../../config/supabase';

export class AllocationRepository {
    public async findByStudentId(studentId: string): Promise<StudentAllocation | null> {
        const { data, error } = await supabase
            .from('student_class_allocations')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw error;
        return data ? new StudentAllocation(
            data.id,
            data.student_id,
            data.academic_year_id,
            data.grade,
            data.section_id,
            data.roll_number,
            new Date(data.allocated_at)
        ) : null;
    }

    public async saveAllocation(allocation: StudentAllocation): Promise<void> {
        const { error } = await supabase
            .from('student_class_allocations')
            .upsert({
                id: allocation.id,
                student_id: allocation.studentId,
                academic_year_id: allocation.academicYearId,
                grade: allocation.grade,
                section_id: allocation.sectionId,
                roll_number: allocation.rollNumber,
                allocated_at: allocation.allocatedAt.toISOString()
            });

        if (error) throw error;
    }

    public async countSectionStudents(
        academicYearId: string,
        grade: string,
        sectionId: string
    ): Promise<number> {
        const { count, error } = await supabase
            .from('student_class_allocations')
            .select('*', { count: 'exact', head: true })
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('section_id', sectionId);

        if (error) throw error;
        return count || 0;
    }

    public async findSequence(
        schoolId: string,
        academicYearId: string,
        grade: string,
        sectionId: string
    ): Promise<any | null> {
        const { data, error } = await supabase
            .from('student_roll_number_sequences')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('section_id', sectionId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async saveSequence(seq: any): Promise<void> {
        const { error } = await supabase
            .from('student_roll_number_sequences')
            .upsert({
                id: seq.id,
                school_id: seq.school_id,
                academic_year_id: seq.academic_year_id,
                grade: seq.grade,
                section_id: seq.section_id,
                current_value: seq.current_value
            });

        if (error) throw error;
    }

    public async saveHistory(history: any): Promise<void> {
        const { error } = await supabase
            .from('student_section_history')
            .insert(history);

        if (error) throw error;
    }

    public async findHistory(studentId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('student_section_history')
            .select('*')
            .eq('student_id', studentId)
            .order('transferred_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }
}
