"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveManagementController = void 0;
const AttendanceValidator_1 = require("../validators/AttendanceValidator");
const supabase_1 = require("../../../config/supabase");
class LeaveManagementController {
    static async submitLeave(req, res) {
        try {
            const validated = AttendanceValidator_1.AttendanceValidator.validateSubmitLeave(req.body);
            const { data, error } = await supabase_1.supabase
                .from('student_leave_requests')
                .insert({
                student_id: validated.student_id,
                start_date: validated.start_date,
                end_date: validated.end_date,
                leave_type: validated.leave_type,
                reason: validated.reason,
                status: 'PENDING'
            })
                .select()
                .single();
            if (error)
                throw error;
            return res.status(201).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to submit leave request.' });
        }
    }
    static async approveLeave(req, res) {
        try {
            const { id, status } = req.body;
            const { data, error } = await supabase_1.supabase
                .from('student_leave_requests')
                .update({ status })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to process leave approval.' });
        }
    }
}
exports.LeaveManagementController = LeaveManagementController;
exports.default = LeaveManagementController;
