import { supabase } from '../../../../../config/supabase';

export class TransportProvisioner {
  public async provision(studentId: string, applicationId: string): Promise<void> {
    // Query student lead details
    const { data: appDetails, error: appErr } = await supabase
      .from('admissions_applications')
      .select('lead_id, leads(remarks)')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (appErr) throw appErr;

    const { error } = await supabase.from('student_transport_allocation').insert({
      student_id: studentId,
      route_id: null, // assigned later
      status: 'Allocated',
    });

    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
  }
}
