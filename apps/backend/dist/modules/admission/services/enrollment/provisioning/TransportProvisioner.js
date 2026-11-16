"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportProvisioner = void 0;
const supabase_1 = require("../../../../../config/supabase");
class TransportProvisioner {
    async provision(studentId, applicationId) {
        // Query student lead details
        const { data: appDetails, error: appErr } = await supabase_1.supabase
            .from('admissions_applications')
            .select('lead_id, leads(remarks)')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (appErr)
            throw appErr;
        const { error } = await supabase_1.supabase.from('student_transport_allocation').insert({
            student_id: studentId,
            route_id: null, // assigned later
            status: 'Allocated',
        });
        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
exports.TransportProvisioner = TransportProvisioner;
