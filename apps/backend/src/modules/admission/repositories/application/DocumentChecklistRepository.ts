import { DocumentChecklist } from '../../domain/DocumentChecklist';
import { supabase } from '../../../../config/supabase';

export class DocumentChecklistRepository {
    public async findByGrade(schoolId: string, academicYearId: string, grade: string): Promise<DocumentChecklist[]> {
        const { data, error } = await supabase
            .from('document_checklists')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade);

        if (error) throw error;
        return (data || []).map(row => new DocumentChecklist(
            row.id,
            row.school_id,
            row.academic_year_id,
            row.grade,
            row.admission_type,
            row.document_type_id,
            row.mandatory,
            row.minimum_copies
        ));
    }
}
