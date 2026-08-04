"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostelProvisioner = void 0;
const supabase_1 = require("../../../../../config/supabase");
class HostelProvisioner {
    async provision(studentId) {
        const { error } = await supabase_1.supabase
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
exports.HostelProvisioner = HostelProvisioner;
