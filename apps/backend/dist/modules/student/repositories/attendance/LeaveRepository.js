"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRepository = void 0;
const LeaveRequest_1 = require("../../domain/attendance/LeaveRequest");
const supabase_1 = require("../../../../config/supabase");
class LeaveRepository {
    async findRequestById(id) {
        const { data, error } = await supabase_1.supabase
            .from('student_leave_requests')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new LeaveRequest_1.LeaveRequest(data.id, data.student_id, data.leave_type_id, new Date(data.start_date), new Date(data.end_date), data.reason, data.status, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async saveRequest(req) {
        const { error } = await supabase_1.supabase
            .from('student_leave_requests')
            .upsert({
            id: req.id,
            student_id: req.studentId,
            leave_type_id: req.leaveTypeId,
            start_date: req.startDate.toISOString().substring(0, 10),
            end_date: req.endDate.toISOString().substring(0, 10),
            reason: req.reason,
            status: req.status,
            updated_at: req.updatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async saveApproval(approval) {
        const { error } = await supabase_1.supabase
            .from('student_leave_approvals')
            .upsert({
            id: approval.id,
            request_id: approval.requestId,
            approved_by: approval.approvedBy,
            remarks: approval.remarks
        });
        if (error)
            throw error;
    }
    async findLeaveTypeById(id) {
        const { data, error } = await supabase_1.supabase
            .from('student_leave_types')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async countApprovedLeaveDays(studentId, leaveTypeId) {
        const { data, error } = await supabase_1.supabase
            .from('student_leave_requests')
            .select('start_date, end_date')
            .eq('student_id', studentId)
            .eq('leave_type_id', leaveTypeId)
            .eq('status', 'APPROVED');
        if (error)
            throw error;
        let totalDays = 0;
        for (const row of data || []) {
            const start = new Date(row.start_date);
            const end = new Date(row.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            totalDays += diffDays;
        }
        return totalDays;
    }
}
exports.LeaveRepository = LeaveRepository;
