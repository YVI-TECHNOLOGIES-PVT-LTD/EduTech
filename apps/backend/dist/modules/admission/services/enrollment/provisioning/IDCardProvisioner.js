"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDCardProvisioner = void 0;
const supabase_1 = require("../../../../../config/supabase");
class IDCardProvisioner {
    async provision(studentId, admissionNumber) {
        const { error } = await supabase_1.supabase
            .from('student_id_cards')
            .insert({
            student_id: studentId,
            barcode: `BAR-${admissionNumber}`,
            qr_code: null,
            printed: false
        });
        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
exports.IDCardProvisioner = IDCardProvisioner;
