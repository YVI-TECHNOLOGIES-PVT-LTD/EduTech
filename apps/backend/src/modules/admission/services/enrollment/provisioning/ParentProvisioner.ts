import { supabase } from '../../../../../config/supabase';

export class ParentProvisioner {
    public async provision(studentId: string, applicationId: string): Promise<void> {
        // Find parents from application
        const { data: parents, error: parentErr } = await supabase
            .from('application_parents')
            .select('*')
            .eq('application_id', applicationId);

        if (parentErr) throw parentErr;

        if (parents && parents.length > 0) {
            for (const parent of parents) {
                const { error } = await supabase
                    .from('student_parents')
                    .insert({
                        student_id: studentId,
                        parent_name: parent.parent_name,
                        relation: parent.relation,
                        mobile_number: parent.mobile_number,
                        email: parent.email
                    });

                if (error && !error.message.includes('does not exist')) {
                    throw error;
                }
            }
        }
    }
}
