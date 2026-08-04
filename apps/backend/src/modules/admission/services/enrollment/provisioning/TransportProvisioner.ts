import { supabase } from '../../../../../config/supabase';

export class TransportProvisioner {
    public async provision(studentId: string, applicationId: string): Promise<void> {
        // Query transport details requested
        const { data: appDetails, error: appErr } = await supabase
            .from('application_profiles')
            .select('allergies') // or checks transport flags
            .eq('application_id', applicationId)
            .maybeSingle();

        if (appErr) throw appErr;

        const { error } = await supabase
            .from('student_transport_allocation')
            .insert({
                student_id: studentId,
                route_id: null, // assigned later
                status: 'Allocated'
            });

        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
