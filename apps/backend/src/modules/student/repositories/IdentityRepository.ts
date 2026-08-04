import { StudentIdentity } from '../domain/StudentIdentity';
import { supabase } from '../../../config/supabase';

export class IdentityRepository {
    public async findByStudentId(studentId: string): Promise<StudentIdentity | null> {
        const { data, error } = await supabase
            .from('student_identity_cards')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw error;
        return data ? new StudentIdentity(
            data.id,
            data.student_id,
            data.barcode,
            data.qr_code,
            data.printed,
            data.issued_date ? new Date(data.issued_date) : null,
            new Date(data.created_at)
        ) : null;
    }

    public async saveIdentity(identity: StudentIdentity): Promise<void> {
        const { error } = await supabase
            .from('student_identity_cards')
            .upsert({
                id: identity.id,
                student_id: identity.studentId,
                barcode: identity.barcode,
                qr_code: identity.qrCode,
                printed: identity.printed,
                issued_date: identity.issuedDate ? identity.issuedDate.toISOString().substring(0, 10) : null
            });

        if (error) throw error;
    }

    public async saveBarcode(barcode: any): Promise<void> {
        const { error } = await supabase
            .from('student_barcodes')
            .upsert({
                id: barcode.id,
                student_id: barcode.studentId,
                barcode_value: barcode.barcodeValue,
                symbology: barcode.symbology
            });

        if (error) throw error;
    }

    public async findBarcodeByStudentId(studentId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('student_barcodes')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
}
