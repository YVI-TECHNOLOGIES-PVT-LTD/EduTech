import { ImportStrategy, ValidationSummary, ExecutionSummary } from '../import.types';
import { supabase } from '../../../config/supabase';
import { z } from 'zod';

const SubjectRowSchema = z.object({
    class_name: z.string().min(1, "Class Name is required").transform(s => s.trim()),
    subject_name: z.string().min(1, "Subject Name is required").transform(s => s.trim()),
    subject_code: z.string().min(1, "Subject Code is required").transform(s => s.trim().toUpperCase()),
    type: z.enum(['theory', 'practical']).optional().default('theory'),
    credits: z.coerce.number().min(0).optional().default(0)
});

export class SubjectImportStrategy implements ImportStrategy {

    async validate(rows: any[], schoolId: string): Promise<ValidationSummary> {
        const result: ValidationSummary = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };

        const classMap = new Map<string, string>(); // Name (lowered) -> ID
        const classNames = rows.map(r => r.class_name?.toString().trim()).filter(Boolean);

        // 1. Fetch Classes
        if (classNames.length > 0) {
            const { data } = await supabase
                .from('classes')
                .select('id, name')
                .eq('school_id', schoolId)
                .in('name', classNames);

            if (data) {
                data.forEach((c: any) => classMap.set(c.name.toLowerCase(), c.id));
            }
        }

        // 2. Validate Rows
        // Note: For duplicate checking (Subject exists in class), we could optimize by fetching all subjects for these classes.
        // Or check row-by-row in execute (allowing skip). The Validate phase should ideally warn.
        // For simplicity and speed in validation step, we check basic constraints. Checking DB for duplicates here involves a complex query 
        // (OR class_id = X AND code = Y). We'll assume Execute handles Unique Constraint Violation as a failure if not captured here, 
        // OR we try to pre-fetch. Let's pre-fetch subjects for the found classes.

        const existingSubjects = new Set<string>(); // key: classId:subjectCode
        if (classMap.size > 0) {
            const classIds = Array.from(classMap.values());
            const { data } = await supabase
                .from('subjects')
                .select('class_id, code')
                .in('class_id', classIds);

            if (data) {
                data.forEach((s: any) => existingSubjects.add(`${s.class_id}:${s.code}`));
            }
        }

        const seenInFile = new Set<string>();

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;
            const errors: any[] = [];

            const parsed = SubjectRowSchema.safeParse(row);

            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({ row: rowNum, column: err.path.join('.'), message: err.message, value: row[err.path[0] as string] });
                });
            } else {
                const { class_name, subject_code } = parsed.data;
                const classId = classMap.get(class_name.toLowerCase());

                if (!classId) {
                    errors.push({ row: rowNum, column: 'class_name', message: `Class '${class_name}' not found. Verify Academic Setup → Classes.`, value: class_name });
                } else {
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

    async execute(validRows: any[], context: { schoolId: string; userId: string; jobId: string }): Promise<ExecutionSummary> {
        const result: ExecutionSummary = {
            totalRows: validRows.length,
            successCount: 0,
            failedCount: 0,
            failedRows: []
        };

        for (const row of validRows) {
            try {
                const { error } = await supabase
                    .from('subjects')
                    .insert({
                        school_id: context.schoolId,
                        class_id: row.class_id,
                        name: row.subject_name,
                        code: row.subject_code,
                        type: row.type,
                        credits: row.credits
                    });

                if (error) throw new Error(error.message);
                result.successCount++;

            } catch (err: any) {
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
