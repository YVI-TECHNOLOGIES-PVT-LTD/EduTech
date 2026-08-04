import { StudentTransfer } from '../domain/StudentTransfer';
import { supabase } from '../../../config/supabase';

export class TransferRepository {
    public async findTransferRequestById(id: string): Promise<StudentTransfer | null> {
        const { data, error } = await supabase
            .from('student_transfer_requests')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new StudentTransfer(
            data.id,
            data.student_id,
            data.destination_school,
            data.reason,
            new Date(data.requested_at),
            data.status as any
        ) : null;
    }

    public async saveTransferRequest(req: StudentTransfer): Promise<void> {
        const { error } = await supabase
            .from('student_transfer_requests')
            .upsert({
                id: req.id,
                student_id: req.studentId,
                destination_school: req.destinationSchool,
                reason: req.reason,
                status: req.status
            });

        if (error) throw error;
    }

    public async saveExitRecord(exit: any): Promise<void> {
        const { error } = await supabase
            .from('student_exit_records')
            .upsert({
                id: exit.id,
                student_id: exit.studentId,
                exit_type: exit.exitType,
                exit_date: exit.exitDate.toISOString().substring(0, 10),
                reason: exit.reason,
                processed_by: exit.processedBy
            });

        if (error) throw error;
    }

    public async findExitRecord(studentId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('student_exit_records')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
}
