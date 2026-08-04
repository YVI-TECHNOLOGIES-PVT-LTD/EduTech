import { LeaveRequest } from '../../domain/attendance/LeaveRequest';
import { LeaveApproval } from '../../domain/attendance/LeaveApproval';
import { supabase } from '../../../../config/supabase';

export class LeaveRepository {
    public async findRequestById(id: string): Promise<LeaveRequest | null> {
        const { data, error } = await supabase
            .from('student_leave_requests')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new LeaveRequest(
            data.id,
            data.student_id,
            data.leave_type_id,
            new Date(data.start_date),
            new Date(data.end_date),
            data.reason,
            data.status as any,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async saveRequest(req: LeaveRequest): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async saveApproval(approval: LeaveApproval): Promise<void> {
        const { error } = await supabase
            .from('student_leave_approvals')
            .upsert({
                id: approval.id,
                request_id: approval.requestId,
                approved_by: approval.approvedBy,
                remarks: approval.remarks
            });

        if (error) throw error;
    }

    public async findLeaveTypeById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('student_leave_types')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async countApprovedLeaveDays(studentId: string, leaveTypeId: string): Promise<number> {
        const { data, error } = await supabase
            .from('student_leave_requests')
            .select('start_date, end_date')
            .eq('student_id', studentId)
            .eq('leave_type_id', leaveTypeId)
            .eq('status', 'APPROVED');

        if (error) throw error;

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
