import { supabase } from '../../../../../config/supabase';

export class HostelProvisioner {
    public async provision(studentId: string): Promise<void> {
        const { error } = await supabase
            .from('student_hostel_allocation')
            .insert({
                student_id: studentId,
                room_id: null,
                status: 'Allocated'
            });

        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
