import { AdmissionFeeStructure, AdmissionFeeComponent } from '../../domain/enrollment/AdmissionFee';
import { FeeAssignment } from '../../domain/enrollment/FeeAssignment';
import { supabase } from '../../../../config/supabase';

export class FeeRepository {
    public async findStructureById(id: string): Promise<AdmissionFeeStructure | null> {
        const { data, error } = await supabase
            .from('admission_fee_structures')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new AdmissionFeeStructure(
            data.id,
            data.school_id,
            data.grade,
            data.academic_year_id,
            data.name,
            data.active
        ) : null;
    }

    public async findComponentsByStructureId(structureId: string): Promise<AdmissionFeeComponent[]> {
        const { data, error } = await supabase
            .from('admission_fee_components')
            .select('*')
            .eq('structure_id', structureId);

        if (error) throw error;
        return (data || []).map(row => new AdmissionFeeComponent(
            row.id,
            row.structure_id,
            row.component_name,
            Number(row.amount),
            row.mandatory
        ));
    }

    public async findAssignmentsByApplicationId(applicationId: string): Promise<FeeAssignment[]> {
        const { data, error } = await supabase
            .from('admission_fee_assignments')
            .select('*')
            .eq('application_id', applicationId);

        if (error) throw error;
        return (data || []).map(row => new FeeAssignment(
            row.id,
            row.application_id,
            row.component_id,
            Number(row.amount),
            Number(row.waived_amount),
            Number(row.paid_amount),
            new Date(row.created_at)
        ));
    }

    public async saveAssignment(assignment: FeeAssignment): Promise<void> {
        const { error } = await supabase
            .from('admission_fee_assignments')
            .upsert({
                id: assignment.id,
                application_id: assignment.applicationId,
                component_id: assignment.componentId,
                amount: assignment.amount,
                waived_amount: assignment.waivedAmount,
                paid_amount: assignment.paidAmount
            });

        if (error) throw error;
    }

    public async saveWaiver(waiver: any): Promise<void> {
        const { error } = await supabase
            .from('admission_fee_waivers')
            .insert({
                id: waiver.id,
                application_id: waiver.application_id,
                component_id: waiver.component_id,
                amount: waiver.amount,
                remarks: waiver.remarks,
                approved_by: waiver.approved_by
            });

        if (error) throw error;
    }

    public async findWaiversByApplicationId(applicationId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('admission_fee_waivers')
            .select('*')
            .eq('application_id', applicationId);

        if (error) throw error;
        return data || [];
    }
}
