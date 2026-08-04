"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentChecklistRepository = void 0;
const DocumentChecklist_1 = require("../../domain/DocumentChecklist");
const supabase_1 = require("../../../../config/supabase");
class DocumentChecklistRepository {
    async findByGrade(schoolId, academicYearId, grade) {
        const { data, error } = await supabase_1.supabase
            .from('document_checklists')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade);
        if (error)
            throw error;
        return (data || []).map(row => new DocumentChecklist_1.DocumentChecklist(row.id, row.school_id, row.academic_year_id, row.grade, row.admission_type, row.document_type_id, row.mandatory, row.minimum_copies));
    }
}
exports.DocumentChecklistRepository = DocumentChecklistRepository;
