import { supabase } from '../../../../../config/supabase';

export class LibraryProvisioner {
    public async provision(studentId: string, admissionNumber: string): Promise<void> {
        const { error } = await supabase
            .from('student_library_accounts')
            .insert({
                student_id: studentId,
                library_card_number: `LIB-${admissionNumber}`,
                status: 'Active'
            });

        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
