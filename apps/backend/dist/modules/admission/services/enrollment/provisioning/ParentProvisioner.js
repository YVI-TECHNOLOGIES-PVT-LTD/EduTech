"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentProvisioner = void 0;
const supabase_1 = require("../../../../../config/supabase");
class ParentProvisioner {
    async provision(studentId, applicationId) {
        // Find parents from application
        const { data: parents, error: parentErr } = await supabase_1.supabase
            .from('application_parents')
            .select('*')
            .eq('application_id', applicationId);
        if (parentErr)
            throw parentErr;
        if (parents && parents.length > 0) {
            for (const parent of parents) {
                const { error } = await supabase_1.supabase
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
exports.ParentProvisioner = ParentProvisioner;
