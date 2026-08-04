import { supabase } from '../../../../../config/supabase';
import { AdmissionLead } from '../../../domain/AdmissionLead';
import { AssignmentStrategy } from './AssignmentStrategy';

export class RoundRobinAssignmentStrategy implements AssignmentStrategy {
    public async assign(lead: AdmissionLead): Promise<string> {
        // Find users matching role = 'COUNSELOR'
        const { data, error } = await supabase
            .from('user_roles')
            .select('user_id, roles!inner(name)')
            .eq('roles.name', 'COUNSELOR')
            .limit(10);

        if (error) throw error;
        if (!data || data.length === 0) {
            // Fall back to a default system admin or throw
            const { data: adminUser, error: adminErr } = await supabase
                .from('users')
                .select('id')
                .eq('status', 'active')
                .limit(1)
                .single();
            if (adminErr || !adminUser) {
                throw new Error('No users available for assignment');
            }
            return adminUser.id;
        }

        // Pick one at random as a placeholder algorithm
        const randomIndex = Math.floor(Math.random() * data.length);
        return data[randomIndex].user_id;
    }
}
