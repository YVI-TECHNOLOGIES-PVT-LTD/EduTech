import { supabase } from '../../../config/supabase';

export class LegacyStructureAdapter {
    /**
     * Maps a legacy admission_fee_structures.id to the corresponding finance_fee_structures.id.
     */
    public static async mapLegacyToFinanceStructure(legacyStructureId: string): Promise<string> {
        // 1. Fetch details of the legacy structure
        const { data: legacy, error: legacyErr } = await supabase
            .from('admission_fee_structures')
            .select('school_id, academic_year_id, grade')
            .eq('id', legacyStructureId)
            .single();

        if (legacyErr || !legacy) {
            throw new Error(`Legacy admission structure not found for ID: ${legacyStructureId}`);
        }

        // 2. Resolve matching class ID
        let { data: cls, error: clsErr } = await supabase
            .from('classes')
            .select('id')
            .eq('school_id', legacy.school_id)
            .eq('academic_year_id', legacy.academic_year_id)
            .ilike('name', legacy.grade)
            .limit(1);

        if ((clsErr || !cls || cls.length === 0) && legacy.grade) {
            let alternativeGrade = legacy.grade;
            if (legacy.grade.toLowerCase().startsWith('grade')) {
                alternativeGrade = legacy.grade.replace(/grade/i, 'Class').trim();
            } else if (legacy.grade.toLowerCase().startsWith('class')) {
                alternativeGrade = legacy.grade.replace(/class/i, 'Grade').trim();
            }
            if (alternativeGrade !== legacy.grade) {
                const { data: clsAlt, error: clsAltErr } = await supabase
                    .from('classes')
                    .select('id')
                    .eq('school_id', legacy.school_id)
                    .eq('academic_year_id', legacy.academic_year_id)
                    .ilike('name', alternativeGrade)
                    .limit(1);
                if (!clsAltErr && clsAlt && clsAlt.length > 0) {
                    cls = clsAlt;
                }
            }
        }

        if (!cls || cls.length === 0) {
            throw new Error(`No class found matching legacy grade: ${legacy.grade}`);
        }

        const classId = cls[0].id;

        // 3. Find mapped new finance structure M2M
        const { data: mapping, error: mapErr } = await supabase
            .from('finance_fee_structure_classes')
            .select('fee_structure_id')
            .eq('class_id', classId)
            .limit(1);

        if (mapErr || !mapping || mapping.length === 0) {
            throw new Error(`No active finance structure mapped to class ID ${classId} for grade ${legacy.grade}`);
        }

        return mapping[0].fee_structure_id;
    }
}
