import { supabase } from '../../../../../config/supabase';

export class IDCardProvisioner {
    public async provision(studentId: string, admissionNumber: string): Promise<void> {
        const { error } = await supabase
            .from('student_id_cards')
            .insert({
                student_id: studentId,
                barcode: `BAR-${admissionNumber}`,
                qr_code: null,
                printed: false
            });

        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
