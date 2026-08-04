import { supabase } from '../../../config/supabase';

export interface FeeStructureAggregate {
    structure: any;
    components: any[];
    installments: any[];
}

export class FeeStructureRepository {
    /**
     * Resolves and returns the aggregate of matching active, latest version fee structure for a class and academic year.
     */
    public static async getStructureAggregate(params: {
        classId: string;
        academicYearId: string;
        date: string;
    }): Promise<FeeStructureAggregate | null> {
        // 1. Get mapped structure IDs for this class
        const { data: mappings, error: mapErr } = await supabase
            .from('finance_fee_structure_classes')
            .select('fee_structure_id')
            .eq('class_id', params.classId);

        if (mapErr || !mappings || mappings.length === 0) {
            return null;
        }

        const structureIds = mappings.map(m => m.fee_structure_id);

        // 2. Fetch matching active structures matching dates and academic year
        const { data: structures, error: structErr } = await supabase
            .from('finance_fee_structures')
            .select('*')
            .in('id', structureIds)
            .eq('academic_year_id', params.academicYearId)
            .eq('is_active', true)
            .lte('effective_from', params.date)
            .gte('effective_to', params.date)
            .order('version', { ascending: false });

        if (structErr || !structures || structures.length === 0) {
            return null;
        }

        // Pick the structure with MAX(version)
        const targetStructure = structures[0];

        // 3. Fetch components
        const { data: components, error: compErr } = await supabase
            .from('finance_fee_structure_components')
            .select('*')
            .eq('fee_structure_id', targetStructure.id)
            .order('display_order', { ascending: true });

        if (compErr) throw compErr;

        // 4. Fetch installments
        const { data: installments, error: instErr } = await supabase
            .from('finance_fee_installments')
            .select('*')
            .eq('fee_structure_id', targetStructure.id);

        if (instErr) throw instErr;

        return {
            structure: targetStructure,
            components: components || [],
            installments: installments || []
        };
    }
}
