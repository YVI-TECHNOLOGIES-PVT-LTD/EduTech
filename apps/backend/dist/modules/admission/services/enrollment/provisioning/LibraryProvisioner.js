"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryProvisioner = void 0;
const supabase_1 = require("../../../../../config/supabase");
class LibraryProvisioner {
    async provision(studentId, admissionNumber) {
        const { error } = await supabase_1.supabase
            .from('student_library_accounts')
            .insert({
            student_id: studentId,
            library_card_number: `LIB-${admissionNumber}`,
            status: 'Active'
        });
        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
exports.LibraryProvisioner = LibraryProvisioner;
