import { supabase } from '../../../../../config/supabase';

export class UserProvisioner {
    public async provision(admissionNumber: string, email: string | null): Promise<void> {
        if (!email) return;

        const { error } = await supabase
            .from('users')
            .insert({
                id: crypto.randomUUID(),
                username: admissionNumber.toLowerCase(),
                email: email,
                role: 'student',
                status: 'Active'
            });

        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
