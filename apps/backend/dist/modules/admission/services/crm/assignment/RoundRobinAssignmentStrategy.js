"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundRobinAssignmentStrategy = void 0;
const supabase_1 = require("../../../../../config/supabase");
class RoundRobinAssignmentStrategy {
    async assign(lead) {
        // Find users matching role = 'COUNSELOR'
        const { data, error } = await supabase_1.supabase
            .from('user_roles')
            .select('user_id, roles!inner(name)')
            .eq('roles.name', 'COUNSELOR')
            .limit(10);
        if (error)
            throw error;
        if (!data || data.length === 0) {
            // Fall back to a default system admin or throw
            const { data: adminUser, error: adminErr } = await supabase_1.supabase
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
exports.RoundRobinAssignmentStrategy = RoundRobinAssignmentStrategy;
