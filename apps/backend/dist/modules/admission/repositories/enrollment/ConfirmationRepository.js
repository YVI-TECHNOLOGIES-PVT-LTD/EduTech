"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationRepository = void 0;
const AdmissionConfirmation_1 = require("../../domain/enrollment/AdmissionConfirmation");
const supabase_1 = require("../../../../config/supabase");
class ConfirmationRepository {
    async findByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_confirmation')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new AdmissionConfirmation_1.AdmissionConfirmation(data.id, data.application_id, data.student_id, data.admission_number, new Date(data.confirmed_at), data.confirmed_by) : null;
    }
    async save(confirmation) {
        const { error } = await supabase_1.supabase
            .from('admission_confirmation')
            .upsert({
            id: confirmation.id,
            application_id: confirmation.applicationId,
            student_id: confirmation.studentId,
            admission_number: confirmation.admissionNumber,
            confirmed_at: confirmation.confirmedAt.toISOString(),
            confirmed_by: confirmation.confirmedBy
        });
        if (error)
            throw error;
    }
    async findSequence(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_number_sequences')
            .select('*')
            .eq('school_id', schoolId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async saveSequence(sequence) {
        const { error } = await supabase_1.supabase
            .from('admission_number_sequences')
            .upsert({
            id: sequence.id,
            school_id: sequence.school_id,
            prefix: sequence.prefix,
            suffix: sequence.suffix,
            current_value: sequence.current_value
        });
        if (error)
            throw error;
    }
}
exports.ConfirmationRepository = ConfirmationRepository;
