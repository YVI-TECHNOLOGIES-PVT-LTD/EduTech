"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeRepository = void 0;
const AdmissionFee_1 = require("../../domain/enrollment/AdmissionFee");
const FeeAssignment_1 = require("../../domain/enrollment/FeeAssignment");
const supabase_1 = require("../../../../config/supabase");
class FeeRepository {
    async findStructureById(id) {
        const { data, error } = await supabase_1.supabase
            .from('admission_fee_structures')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new AdmissionFee_1.AdmissionFeeStructure(data.id, data.school_id, data.grade, data.academic_year_id, data.name, data.active) : null;
    }
    async findComponentsByStructureId(structureId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_fee_components')
            .select('*')
            .eq('structure_id', structureId);
        if (error)
            throw error;
        return (data || []).map(row => new AdmissionFee_1.AdmissionFeeComponent(row.id, row.structure_id, row.component_name, Number(row.amount), row.mandatory));
    }
    async findAssignmentsByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_fee_assignments')
            .select('*')
            .eq('application_id', applicationId);
        if (error)
            throw error;
        return (data || []).map(row => new FeeAssignment_1.FeeAssignment(row.id, row.application_id, row.component_id, Number(row.amount), Number(row.waived_amount), Number(row.paid_amount), new Date(row.created_at)));
    }
    async saveAssignment(assignment) {
        const { error } = await supabase_1.supabase
            .from('admission_fee_assignments')
            .upsert({
            id: assignment.id,
            application_id: assignment.applicationId,
            component_id: assignment.componentId,
            amount: assignment.amount,
            waived_amount: assignment.waivedAmount,
            paid_amount: assignment.paidAmount
        });
        if (error)
            throw error;
    }
    async saveWaiver(waiver) {
        const { error } = await supabase_1.supabase
            .from('admission_fee_waivers')
            .insert({
            id: waiver.id,
            application_id: waiver.application_id,
            component_id: waiver.component_id,
            amount: waiver.amount,
            remarks: waiver.remarks,
            approved_by: waiver.approved_by
        });
        if (error)
            throw error;
    }
    async findWaiversByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_fee_waivers')
            .select('*')
            .eq('application_id', applicationId);
        if (error)
            throw error;
        return data || [];
    }
}
exports.FeeRepository = FeeRepository;
