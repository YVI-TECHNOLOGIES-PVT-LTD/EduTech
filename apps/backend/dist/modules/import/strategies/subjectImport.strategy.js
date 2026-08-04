"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectImportStrategy = void 0;
const supabase_1 = require("../../../config/supabase");
const zod_1 = require("zod");
const SubjectRowSchema = zod_1.z.object({
    class_name: zod_1.z.string().min(1, "Class Name is required").transform(s => s.trim()),
    subject_name: zod_1.z.string().min(1, "Subject Name is required").transform(s => s.trim()),
    subject_code: zod_1.z.string().min(1, "Subject Code is required").transform(s => s.trim().toUpperCase()),
    type: zod_1.z.enum(['theory', 'practical']).optional().default('theory'),
    credits: zod_1.z.coerce.number().min(0).optional().default(0)
});
class SubjectImportStrategy {
    async validate(rows, schoolId) {
        const result = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };
        const classMap = new Map(); // Name (lowered) -> ID
        const classNames = rows.map(r => r.class_name?.toString().trim()).filter(Boolean);
        // 1. Fetch Classes
        if (classNames.length > 0) {
            const { data } = await supabase_1.supabase
                .from('classes')
                .select('id, name')
                .eq('school_id', schoolId)
                .in('name', classNames);
            if (data) {
                data.forEach((c) => classMap.set(c.name.toLowerCase(), c.id));
            }
        }
        // 2. Validate Rows
        // Note: For duplicate checking (Subject exists in class), we could optimize by fetching all subjects for these classes.
        // Or check row-by-row in execute (allowing skip). The Validate phase should ideally warn.
        // For simplicity and speed in validation step, we check basic constraints. Checking DB for duplicates here involves a complex query 
        // (OR class_id = X AND code = Y). We'll assume Execute handles Unique Constraint Violation as a failure if not captured here, 
        // OR we try to pre-fetch. Let's pre-fetch subjects for the found classes.
        const existingSubjects = new Set(); // key: classId:subjectCode
        if (classMap.size > 0) {
            const classIds = Array.from(classMap.values());
            const { data } = await supabase_1.supabase
                .from('subjects')
                .select('class_id, code')
                .in('class_id', classIds);
            if (data) {
                data.forEach((s) => existingSubjects.add(`${s.class_id}:${s.code}`));
            }
        }
        const seenInFile = new Set();
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;
            const errors = [];
            const parsed = SubjectRowSchema.safeParse(row);
            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({ row: rowNum, column: err.path.join('.'), message: err.message, value: row[err.path[0]] });
                });
            }
            else {
                const { class_name, subject_code } = parsed.data;
                const classId = classMap.get(class_name.toLowerCase());
                if (!classId) {
                    errors.push({ row: rowNum, column: 'class_name', message: `Class '${class_name}' not found. Verify Academic Setup → Classes.`, value: class_name });
                }
                else {
                    const key = `${classId}:${subject_code}`;
                    if (existingSubjects.has(key) || seenInFile.has(key)) {
                        errors.push({ row: rowNum, column: 'subject_code', message: `Subject code '${subject_code}' already exists for this class`, value: subject_code });
                    }
                    seenInFile.add(key);
                }
                if (errors.length === 0) {
                    result.validRows.push({ ...parsed.data, class_id: classId, _rowNum: rowNum });
                }
            }
            if (errors.length > 0) {
                result.failedRows.push({ row: rowNum, errors, data: row });
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
        for (const row of validRows) {
            try {
                const { error } = await supabase_1.supabase
                    .from('subjects')
                    .insert({
                    school_id: context.schoolId,
                    class_id: row.class_id,
                    name: row.subject_name,
                    code: row.subject_code,
                    type: row.type,
                    credits: row.credits
                });
                if (error)
                    throw new Error(error.message);
                result.successCount++;
            }
            catch (err) {
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: [{ row: row._rowNum, message: err.message, value: 'INSERT_FAIL' }],
                    data: row
                });
            }
        }
        return result;
    }
}
exports.SubjectImportStrategy = SubjectImportStrategy;
