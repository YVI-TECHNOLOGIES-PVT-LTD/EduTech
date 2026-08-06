"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverImportStrategy = void 0;
const supabase_1 = require("../../../config/supabase");
const zod_1 = require("zod");
const crypto = __importStar(require("crypto"));
// Schema for a single row
const DriverRowSchema = zod_1.z.object({
    full_name: zod_1.z.string().min(1, "Full Name is required"),
    email: zod_1.z.string().email("Invalid email format").transform(str => str.toLowerCase().trim()),
    phone: zod_1.z.string().min(10, "Phone number must be at least 10 digits"),
    license_no: zod_1.z.string().min(5, "License Number is required").transform(str => str.trim().toUpperCase()),
    license_expiry: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry must be YYYY-MM-DD")
        .refine((date) => new Date(date) > new Date(), { message: "License has expired" })
});
class DriverImportStrategy {
    constructor() {
        // Cache for Role ID
        this.driverRoleId = null;
    }
    async validate(rows, schoolId) {
        const result = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };
        const normalizedRows = rows.map((r, i) => ({
            ...r,
            _originalIndex: i + 1,
            email: r.email ? String(r.email).toLowerCase().trim() : '',
            license_no: r.license_no ? String(r.license_no).trim().toUpperCase() : '',
            phone: r.phone ? String(r.phone).trim() : ''
        }));
        // 1. Bulk Prefetch
        const emails = normalizedRows.map(r => r.email).filter(Boolean);
        const phones = normalizedRows.map(r => r.phone).filter(Boolean);
        const licenses = normalizedRows.map(r => r.license_no).filter(Boolean);
        const existingEmails = new Set();
        const existingPhones = new Set();
        const existingLicenses = new Set();
        // Check Emails in public.users (Broad check)
        if (emails.length > 0) {
            const { data } = await supabase_1.supabase.from('users').select('email').in('email', emails);
            if (data)
                data.forEach((u) => existingEmails.add(u.email));
        }
        // Check Phones/Licenses in transport_drivers
        if (phones.length > 0) {
            const { data } = await supabase_1.supabase.from('transport_drivers').select('phone').eq('school_id', schoolId).in('phone', phones);
            if (data)
                data.forEach((d) => existingPhones.add(d.phone));
        }
        if (licenses.length > 0) {
            const { data } = await supabase_1.supabase.from('transport_drivers').select('license_number').eq('school_id', schoolId).in('license_number', licenses);
            if (data)
                data.forEach((d) => existingLicenses.add(d.license_number));
        }
        const seenEmail = new Set();
        const seenLicense = new Set();
        // 2. Row Validation
        for (const row of normalizedRows) {
            const rowNum = row._originalIndex;
            const errors = [];
            const originalData = rows[rowNum - 1];
            const parsed = DriverRowSchema.safeParse(originalData);
            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({
                        row: rowNum,
                        column: err.path.join('.'),
                        message: err.message,
                        value: originalData[err.path[0]]
                    });
                });
            }
            else {
                // Logic Validation
                const { email, license_no, phone } = parsed.data;
                if (existingEmails.has(email) || seenEmail.has(email)) {
                    errors.push({ row: rowNum, column: 'email', message: `Email '${email}' already exists or duplicate in file`, value: email });
                }
                if (existingPhones.has(phone)) {
                    errors.push({ row: rowNum, column: 'phone', message: `Phone '${phone}' already taken`, value: phone });
                }
                if (existingLicenses.has(license_no) || seenLicense.has(license_no)) {
                    errors.push({ row: rowNum, column: 'license_no', message: `License '${license_no}' already exists or duplicate`, value: license_no });
                }
                seenEmail.add(email);
                seenLicense.add(license_no);
            }
            if (errors.length > 0) {
                result.failedRows.push({ row: rowNum, errors, data: originalData });
            }
            else {
                result.validRows.push({ ...parsed.data, _rowNum: rowNum });
            }
        }
        result.isValid = result.failedRows.length === 0;
        return result;
    }
    async execute(validRows, context) {
        const result = {
            totalRows: validRows.length,
            successCount: 0,
            failedCount: 0,
            failedRows: []
        };
        // Fetch Role ID once
        if (!this.driverRoleId) {
            const { data } = await supabase_1.supabase.from('roles').select('id').eq('name', 'DRIVER').single();
            if (!data)
                throw new Error("Configuration Error: DRIVER role missing in system");
            this.driverRoleId = data.id;
        }
        // Sequential Execution with Compensation
        for (const row of validRows) {
            let authUserId = null;
            try {
                // A. Create Auth User
                const tempPassword = crypto.randomBytes(8).toString('hex') + 'A1!'; // Ensure complexity
                const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.createUser({
                    email: row.email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: row.full_name,
                        school_id: context.schoolId
                    }
                });
                if (authError || !authData.user) {
                    throw new Error(`Auth creation failed: ${authError?.message}`);
                }
                authUserId = authData.user.id;
                // B. Ensure public.users (Trigger usually handles this, but we upsert to be sure before linking)
                // This prevents race conditions if the trigger is slow
                const { error: userError } = await supabase_1.supabase.from('users').upsert({
                    id: authUserId,
                    school_id: context.schoolId,
                    email: row.email,
                    full_name: row.full_name,
                    status: 'active'
                });
                if (userError)
                    throw new Error(`Profile sync failed: ${userError.message}`);
                // C. Assign Role
                const { error: roleError } = await supabase_1.supabase.from('user_roles').insert({
                    user_id: authUserId,
                    role_id: this.driverRoleId
                });
                if (roleError)
                    throw new Error(`Role assignment failed: ${roleError.message}`);
                // D. Insert Driver Profile
                // Note: license_expiry is validated but NOT persisted as per schema limitations
                const { error: driverError } = await supabase_1.supabase.from('transport_drivers').insert({
                    school_id: context.schoolId,
                    user_id: authUserId,
                    license_number: row.license_no,
                    phone: row.phone,
                    status: 'ACTIVE'
                });
                if (driverError)
                    throw new Error(`Driver profile failed: ${driverError.message}`);
                result.successCount++;
            }
            catch (err) {
                // COMPENSATION: Delete Auth User if created
                if (authUserId) {
                    await supabase_1.supabase.auth.admin.deleteUser(authUserId).catch(e => console.error("Compensation failed", e));
                }
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: [{ row: row._rowNum, message: err.message, value: 'EXECUTION_FAIL' }],
                    data: row
                });
            }
        }
        return result;
    }
}
exports.DriverImportStrategy = DriverImportStrategy;
