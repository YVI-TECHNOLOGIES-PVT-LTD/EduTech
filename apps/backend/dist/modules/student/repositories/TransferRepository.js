"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferRepository = void 0;
const StudentTransfer_1 = require("../domain/StudentTransfer");
const supabase_1 = require("../../../config/supabase");
class TransferRepository {
    async findTransferRequestById(id) {
        const { data, error } = await supabase_1.supabase
            .from('student_transfer_requests')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new StudentTransfer_1.StudentTransfer(data.id, data.student_id, data.destination_school, data.reason, new Date(data.requested_at), data.status) : null;
    }
    async saveTransferRequest(req) {
        const { error } = await supabase_1.supabase
            .from('student_transfer_requests')
            .upsert({
            id: req.id,
            student_id: req.studentId,
            destination_school: req.destinationSchool,
            reason: req.reason,
            status: req.status
        });
        if (error)
            throw error;
    }
    async saveExitRecord(exit) {
        const { error } = await supabase_1.supabase
            .from('student_exit_records')
            .upsert({
            id: exit.id,
            student_id: exit.studentId,
            exit_type: exit.exitType,
            exit_date: exit.exitDate.toISOString().substring(0, 10),
            reason: exit.reason,
            processed_by: exit.processedBy
        });
        if (error)
            throw error;
    }
    async findExitRecord(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_exit_records')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
}
exports.TransferRepository = TransferRepository;
