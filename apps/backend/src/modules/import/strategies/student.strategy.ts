import { ImportStrategy, ValidationSummary, ExecutionSummary, FailedRow, ImportOptions } from '../import.types';
import { supabase } from '../../../config/supabase';
import { z } from 'zod';

// 1. Normalization Utility
const normalizeDate = (value: any): string => {
    if (!value) return '';

    let date: Date;

    if (value instanceof Date) {
        date = value;
    } else if (typeof value === 'number') {
        // Excel serial date handling (base date is Dec 30, 1899)
        date = new Date((value - 25569) * 86400 * 1000);
    } else {
        date = new Date(String(value).trim());
    }

    if (isNaN(date.getTime())) return String(value); // Return as-is, Zod will catch invalid date

    return date.toISOString().split('T')[0];
};

const normalizeStudentRow = (rawRow: any) => {
    // 1. Convert all keys to lowercase to handle header casing variance
    const row: any = {};
    Object.keys(rawRow).forEach(key => {
        row[key.toLowerCase().trim().replace(/\s+/g, '_')] = rawRow[key];
    });

    // 2. Map aliases (Excel 'class_name' -> Schema 'grade_applied_for')
    if (row.class_name && !row.grade_applied_for) {
        row.grade_applied_for = row.class_name;
    }

    // 3. Trim all string values
    Object.keys(row).forEach(key => {
        if (typeof row[key] === 'string') {
            row[key] = row[key].trim();
        }
    });

    // 4. Normalize Enums & Fields
    if (row.gender) {
        let gender = String(row.gender).toUpperCase().trim();
        if (gender === 'M' || gender === 'MALE') {
            row.gender = 'Male';
        } else if (gender === 'F' || gender === 'FEMALE') {
            row.gender = 'Female';
        } else if (gender === 'OTHER') {
            row.gender = 'Other';
        } else {
            // Title case fallback for whatever they typed if it starts with the right letter
            row.gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
        }
    }

    if (row.section_name) {
        row.section_name = String(row.section_name).toUpperCase();
    }

    if (row.student_code) {
        row.student_code = String(row.student_code).toUpperCase();
    }

    if (row.parent_phone) {
        row.parent_phone = String(row.parent_phone);
    }

    if (row.dob) {
        row.dob = normalizeDate(row.dob);
    }

    return row;
};

// 2. Updated Zod Schema
const StudentRowSchema = z.object({
    student_code: z.string().min(1, "Student Code is required"),
    full_name: z.string().min(1, "Full Name is required"),
    gender: z.enum(['Male', 'Female', 'Other'], {
        errorMap: (issue, ctx) => ({
            message: `Invalid gender '${ctx.data}'. Allowed values: Male, Female, Other`
        })
    }),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of Birth must be YYYY-MM-DD"),
    grade_applied_for: z.string().min(1, "Grade/Class is required"),
    section_name: z.enum(['A', 'B'], {
        errorMap: (issue, ctx) => ({
            message: `Invalid section '${ctx.data}'. Allowed values: A, B`
        })
    }).optional()
});

export class StudentImportStrategy implements ImportStrategy {

    async validate(rows: any[], schoolId: string, options?: ImportOptions): Promise<ValidationSummary> {
        const result: ValidationSummary = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };

        // Normalize all rows first
        const normalizedRows = rows.map(r => normalizeStudentRow(r));

        // 1. Bulk verify uniqueness of student_code
        const codes = normalizedRows.map(r => r.student_code).filter(c => c);

        let existingCodes = new Set<string>();
        if (codes.length > 0) {
            const { data } = await supabase
                .from('students')
                .select('student_code')
                .eq('school_id', schoolId)
                .in('student_code', codes);

            if (data) {
                data.forEach((s: any) => existingCodes.add(s.student_code));
            }
        }

        // 2. Row-by-row validation
        for (let i = 0; i < normalizedRows.length; i++) {
            const row = normalizedRows[i];
            const rowNum = i + 1;
            const errors: any[] = [];

            const parsed = StudentRowSchema.safeParse(row);

            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({
                        row: rowNum,
                        column: err.path.join('.'),
                        message: err.message,
                        value: row[err.path[0] as string]
                    });
                });
            } else {
                // Logic Validation
                if (existingCodes.has(row.student_code)) {
                    errors.push({
                        row: rowNum,
                        column: 'student_code',
                        message: `Student code '${row.student_code}' already exists in system`,
                        value: row.student_code
                    });
                }
            }

            if (errors.length > 0) {
                result.failedRows.push({ row: rowNum, errors, data: row });
            } else {
                result.validRows.push(row);
            }
        }

        result.isValid = result.failedRows.length === 0;
        return result;
    }

    async execute(validRows: any[], context: { schoolId: string; userId: string; jobId: string; userMode?: 'STRICT' | 'AUTO_CREATE' }): Promise<ExecutionSummary> {
        const result: ExecutionSummary = {
            totalRows: validRows.length,
            successCount: 0,
            failedCount: 0,
            failedRows: []
        };

        const academicYearId = await this.getLatestAcademicYear(context.schoolId);

        for (let i = 0; i < validRows.length; i++) {
            const row = validRows[i];
            const rowNum = i + 1;

            try {
                // Persistent Context Requirement: Row-level transaction safety via single RPC or sequential steps
                // Since this standard strategy uses direct Table API, we wrap in a simplified rollback logic.
                // In a truly hardened system, we would move this to a Postgres function (RPC).

                const { data: admission, error: admError } = await supabase
                    .from('admissions')
                    .insert({
                        school_id: context.schoolId,
                        academic_year_id: academicYearId,
                        applicant_user_id: context.userId,
                        student_name: row.full_name,
                        date_of_birth: row.dob,
                        gender: row.gender,
                        grade_applied_for: row.grade_applied_for,
                        status: 'approved',
                        submitted_at: new Date()
                    })
                    .select()
                    .single();

                if (admError) throw new Error(`Admission error: ${admError.message}`);

                const { error: stuError } = await supabase
                    .from('students')
                    .insert({
                        school_id: context.schoolId,
                        admission_id: admission.id,
                        student_code: row.student_code,
                        full_name: row.full_name,
                        date_of_birth: row.dob,
                        gender: row.gender,
                        status: 'active'
                    });

                if (stuError) {
                    // Manual rollback for persistence integrity
                    await supabase.from('admissions').delete().eq('id', admission.id);
                    throw new Error(`Student error: ${stuError.message}`);
                }

                // Optional Section Assignment if included in row
                if (row.section_name) {
                    const { data: section } = await supabase
                        .from('sections')
                        .select('id')
                        .eq('name', row.section_name)
                        .eq('class.name', row.grade_applied_for)
                        .eq('class.academic_year_id', academicYearId)
                        .single();

                    if (section) {
                        const { error: ssError } = await supabase.rpc('fn_assign_student_with_capacity_guard', {
                            p_student_id: (await supabase.from('students').select('id').eq('student_code', row.student_code).single()).data?.id,
                            p_section_id: section.id,
                            p_academic_year_id: academicYearId,
                            p_max_capacity: 15
                        });
                        if (ssError) console.warn(`Auto-section assignment failed for ${row.student_code}: ${ssError.message}`);
                    }
                }

                result.successCount++;

            } catch (err: any) {
                result.failedCount++;
                result.failedRows.push({
                    row: rowNum,
                    errors: [{ row: rowNum, message: err.message, value: 'DB_FAILED' }],
                    data: row
                });

                // If not allowing partial import, we should probably throw and stop? 
                // But ExecutionSummary design usually collects offsets.
            }
        }

        return result;
    }

    private async getLatestAcademicYear(schoolId: string): Promise<string> {
        const { data } = await supabase
            .from('academic_years')
            .select('id')
            .eq('school_id', schoolId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (data) return data.id;

        const { data: anyData } = await supabase
            .from('academic_years')
            .select('id')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return anyData?.id || '';
    }
}

