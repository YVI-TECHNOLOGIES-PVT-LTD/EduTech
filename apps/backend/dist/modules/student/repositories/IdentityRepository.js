"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityRepository = void 0;
const StudentIdentity_1 = require("../domain/StudentIdentity");
const supabase_1 = require("../../../config/supabase");
class IdentityRepository {
    async findByStudentId(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_identity_cards')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new StudentIdentity_1.StudentIdentity(data.id, data.student_id, data.barcode, data.qr_code, data.printed, data.issued_date ? new Date(data.issued_date) : null, new Date(data.created_at)) : null;
    }
    async saveIdentity(identity) {
        const { error } = await supabase_1.supabase
            .from('student_identity_cards')
            .upsert({
            id: identity.id,
            student_id: identity.studentId,
            barcode: identity.barcode,
            qr_code: identity.qrCode,
            printed: identity.printed,
            issued_date: identity.issuedDate ? identity.issuedDate.toISOString().substring(0, 10) : null
        });
        if (error)
            throw error;
    }
    async saveBarcode(barcode) {
        const { error } = await supabase_1.supabase
            .from('student_barcodes')
            .upsert({
            id: barcode.id,
            student_id: barcode.studentId,
            barcode_value: barcode.barcodeValue,
            symbology: barcode.symbology
        });
        if (error)
            throw error;
    }
    async findBarcodeByStudentId(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_barcodes')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
}
exports.IdentityRepository = IdentityRepository;
