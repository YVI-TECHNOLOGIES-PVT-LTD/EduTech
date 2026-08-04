import { AdmissionConfirmation } from '../../domain/enrollment/AdmissionConfirmation';
import { supabase } from '../../../../config/supabase';

export class ConfirmationRepository {
    public async findByApplicationId(applicationId: string): Promise<AdmissionConfirmation | null> {
        const { data, error } = await supabase
            .from('admission_confirmation')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data ? new AdmissionConfirmation(
            data.id,
            data.application_id,
            data.student_id,
            data.admission_number,
            new Date(data.confirmed_at),
            data.confirmed_by
        ) : null;
    }

    public async save(confirmation: AdmissionConfirmation): Promise<void> {
        const { error } = await supabase
            .from('admission_confirmation')
            .upsert({
                id: confirmation.id,
                application_id: confirmation.applicationId,
                student_id: confirmation.studentId,
                admission_number: confirmation.admissionNumber,
                confirmed_at: confirmation.confirmedAt.toISOString(),
                confirmed_by: confirmation.confirmedBy
            });

        if (error) throw error;
    }

    public async findSequence(schoolId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_number_sequences')
            .select('*')
            .eq('school_id', schoolId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async saveSequence(sequence: any): Promise<void> {
        const { error } = await supabase
            .from('admission_number_sequences')
            .upsert({
                id: sequence.id,
                school_id: sequence.school_id,
                prefix: sequence.prefix,
                suffix: sequence.suffix,
                current_value: sequence.current_value
            });

        if (error) throw error;
    }
}
