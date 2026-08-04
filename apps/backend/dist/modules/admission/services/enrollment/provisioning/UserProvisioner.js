"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProvisioner = void 0;
const supabase_1 = require("../../../../../config/supabase");
class UserProvisioner {
    async provision(admissionNumber, email) {
        if (!email)
            return;
        const { error } = await supabase_1.supabase
            .from('users')
            .insert({
            id: crypto.randomUUID(),
            username: admissionNumber.toLowerCase(),
            email: email,
            role: 'student',
            status: 'Active'
        });
        if (error && !error.message.includes('does not exist')) {
            throw error;
        }
    }
}
exports.UserProvisioner = UserProvisioner;
