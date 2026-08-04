import { Router, Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { AcademicAssignmentService } from '../academic/academic.service';
import multer from 'multer';
import * as csv from 'csv-parse/sync';
import * as xlsx from 'xlsx';
import { blockInProduction } from '../../middleware/production.middleware';

export const bulkRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to prevent modifications to CLOSED years
const checkYearNotClosed = async (yearId: string) => {
    const { data: year } = await supabase
        .from('academic_years')
        .select('status')
        .eq('id', yearId)
        .single();

    if (year?.status === 'CLOSED') {
        throw new Error("This academic year is CLOSED and cannot be modified.");
    }
};

/**
 * Common Logic for Ingestion
 */
const parseFile = (file: Express.Multer.File): any[] => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        return csv.parse(file.buffer.toString(), {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
    } else {
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(sheet);
    }
};

// ======================================
// 1. BULK STUDENT SECTION ASSIGNMENT
// ======================================
// CSV: student_code, class_code, section_code
bulkRouter.post('/student-section/assign',
    upload.single('file'),
    checkPermission(PERMISSIONS.STUDENT_ASSIGN_SECTION),
    async (req: Request, res: Response) => {
        if (!req.file) return res.status(400).json({ error: "File is required" });
        const schoolId = req.context!.user.school_id;
        const userId = req.context!.user.id;

        try {
            const rows = parseFile(req.file);
            const academicYearId = req.body.academic_year_id; // Frontend should pass this or we use active

            if (!academicYearId) return res.status(400).json({ error: "academic_year_id is required" });
            await checkYearNotClosed(academicYearId);

            const report = {
                total: rows.length,
                success: 0,
                failure: 0,
                details: [] as any[]
            };

            for (const row of rows) {
                const { student_code, class_code, section_code } = row;
                try {
                    // 1. Resolve Student
                    const { data: student } = await supabase
                        .from('students')
                        .select('id, admission_id')
                        .eq('student_code', student_code)
                        .eq('school_id', schoolId)
                        .single();

                    if (!student) throw new Error(`Student ${student_code} not found`);

                    // 2. Resolve Section (By code/name in this year)
                    // Note: Schema 'sections' doesn't have 'code', usually uses 'name'. 
                    // Classes usually have 'name'. We'll match against names.
                    const { data: section } = await supabase
                        .from('sections')
                        .select('id, name, class:class_id(id, name)')
                        .eq('name', section_code)
                        .eq('class.name', class_code)
                        .eq('class.academic_year_id', academicYearId)
                        .single();

                    if (!section) throw new Error(`Section ${section_code} in Class ${class_code} not found for this year`);

                    // 3. Call Atomic RPC with Capacity Guard
                    const { error: upsertError } = await supabase.rpc('fn_assign_student_with_capacity_guard', {
                        p_student_id: student.id,
                        p_section_id: section.id,
                        p_academic_year_id: academicYearId,
                        p_max_capacity: 15 // Business Requirement
                    });

                    if (upsertError) {
                        // Handle specific SECTION_FULL error message for better reporting
                        if (upsertError.message?.includes('SECTION_FULL')) {
                            throw new Error(`Section ${section_code} is already FULL (Max 15)`);
                        }
                        throw upsertError;
                    }

                    await AcademicAssignmentService.syncStudentWithSectionFaculty(student.id, section.id, academicYearId);

                    // 4. Log to Timeline
                    if (student.admission_id) {
                        await supabase.from('admission_audit_logs').insert({
                            admission_id: student.admission_id,
                            action: 'CLASS_ASSIGNED',
                            performed_by: userId,
                            remarks: `Bulk assigned to Class ${class_code} - ${section_code}`
                        });
                    }

                    report.success++;
                    report.details.push({ student_code, status: 'SUCCESS' });
                } catch (err: any) {
                    report.failure++;
                    report.details.push({ student_code, status: 'FAILURE', reason: err.message });
                }
            }

            // Global Log
            await supabase.from('academic_automation_logs').insert({
                school_id: schoolId,
                action: 'BULK_ASSIGNMENT',
                details: { success: report.success, failure: report.failure },
                performed_by: userId
            });

            res.json(report);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ======================================
// 2. BULK PROMOTION
// ======================================
// CSV: student_code, target_academic_year (label), target_class, target_section
bulkRouter.post('/students/promote',
    upload.single('file'),
    checkPermission(PERMISSIONS.STUDENT_ASSIGN_SECTION),
    async (req: Request, res: Response) => {
        if (!req.file) return res.status(400).json({ error: "File is required" });
        const { from_academic_year_id, is_dry_run } = req.body;
        const schoolId = req.context!.user.school_id;
        const performedBy = req.context!.user.id;

        if (!from_academic_year_id) return res.status(400).json({ error: "from_academic_year_id is required" });

        try {
            const rows = parseFile(req.file);
            const report = {
                total: rows.length,
                success: 0,
                failure: 0,
                details: [] as any[]
            };

            // 1. Safety Check for 'From' Year (No ongoing exams)
            const today = new Date().toISOString().split('T')[0];
            const { data: activeExams } = await supabase
                .from('exams')
                .select('id, name')
                .eq('academic_year_id', from_academic_year_id)
                .gte('end_date', today);

            if (activeExams && activeExams.length > 0) {
                return res.status(400).json({
                    error: `Cannot promote while exams are active for the current year: ${activeExams.map(e => e.name).join(', ')}`
                });
            }

            for (const row of rows) {
                const { student_code, target_academic_year, target_class, target_section } = row;
                try {
                    // Resolve Data
                    const { data: student } = await supabase.from('students').select('id, admission_id').eq('student_code', student_code).eq('school_id', schoolId).single();
                    if (!student) throw new Error("Student not found");

                    const { data: targetYear } = await supabase.from('academic_years').select('id, status').eq('year_label', target_academic_year).eq('school_id', schoolId).single();
                    if (!targetYear) throw new Error(`Target year ${target_academic_year} not found`);
                    if (targetYear.id === from_academic_year_id) throw new Error("Target year cannot be same as source");
                    if (targetYear.status === 'CLOSED') throw new Error("Target year is CLOSED");

                    const { data: section } = await supabase
                        .from('sections')
                        .select('id, class:class_id(id, academic_year_id, name)')
                        .eq('name', target_section)
                        .eq('class.name', target_class)
                        .eq('class.academic_year_id', targetYear.id)
                        .single();

                    if (!section) throw new Error(`Target section ${target_section} in Class ${target_class} not found for ${target_academic_year}`);

                    if (!is_dry_run) {
                        const { error: promoError } = await supabase
                            .from('student_sections')
                            .upsert({
                                student_id: student.id,
                                section_id: section.id,
                                academic_year_id: targetYear.id
                            }, { onConflict: 'student_id, academic_year_id' });

                        if (promoError) throw promoError;

                        await AcademicAssignmentService.syncStudentWithSectionFaculty(student.id, section.id, targetYear.id);

                        if (student.admission_id) {
                            await supabase.from('admission_audit_logs').insert({
                                admission_id: student.admission_id,
                                action: 'STUDENT_PROMOTED',
                                performed_by: performedBy,
                                remarks: `Bulk promoted to ${target_academic_year}: ${target_class} - ${target_section}`
                            });
                        }
                    }

                    report.success++;
                    report.details.push({ student_code, status: 'SUCCESS' });

                } catch (err: any) {
                    report.failure++;
                    report.details.push({ student_code, status: 'FAILURE', reason: err.message });
                }
            }

            if (!is_dry_run) {
                await supabase.from('academic_automation_logs').insert({
                    school_id: schoolId,
                    action: 'BULK_PROMOTION',
                    details: { success: report.success, failure: report.failure },
                    performed_by: performedBy
                });
            }

            res.json({ message: is_dry_run ? "Dry run completed" : "Promotion process completed", report });

        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ======================================
// 3. BULK ATTENDANCE (ADMIN SEED)
// ======================================
// CSV: student_code, date, status
bulkRouter.post('/attendance/seed',
    blockInProduction,
    upload.single('file'),
    checkPermission(PERMISSIONS.DASHBOARD_VIEW_ADMIN),
    async (req: Request, res: Response) => {
        if (!req.file) return res.status(400).json({ error: "File is required" });
        const { academic_year_id } = req.body;
        if (!academic_year_id) return res.status(400).json({ error: "academic_year_id is required" });

        const schoolId = req.context!.user.school_id;
        const userId = req.context!.user.id;

        try {
            await checkYearNotClosed(academic_year_id);
            const rows = parseFile(req.file);
            const report = { total: rows.length, success: 0, failure: 0, details: [] as any[] };

            // Cache for Sessions to avoid redundant lookups/inserts
            // key: sectionId + date
            const sessionCache = new Map<string, string>();

            for (const row of rows) {
                const { student_code, date, status } = row;
                try {
                    // 1. Resolve Student
                    const { data: student } = await supabase
                        .from('students')
                        .select('id, student_sections!inner(section_id)')
                        .eq('student_code', student_code)
                        .eq('school_id', schoolId)
                        .eq('student_sections.academic_year_id', academic_year_id)
                        .single();

                    if (!student) throw new Error(`Student ${student_code} not found or not assigned to a section in this year`);
                    const sectionId = (student.student_sections as any[])[0].section_id;

                    // 2. Resolve/Create Session
                    const cacheKey = `${sectionId}_${date}`;
                    let sessionId = sessionCache.get(cacheKey);

                    if (!sessionId) {
                        const { data: session, error: sessErr } = await supabase
                            .from('attendance_sessions')
                            .select('id')
                            .eq('section_id', sectionId)
                            .eq('date', date)
                            .maybeSingle();

                        if (session) {
                            sessionId = session.id;
                        } else {
                            const { data: newSess, error: insErr } = await supabase
                                .from('attendance_sessions')
                                .insert({
                                    school_id: schoolId,
                                    academic_year_id,
                                    section_id: sectionId,
                                    date,
                                    marked_by: userId
                                })
                                .select('id')
                                .single();

                            if (insErr) {
                                if (insErr.message?.includes('DATE_OUT_OF_RANGE')) {
                                    throw new Error(`Date ${date} is outside Academic Year boundaries.`);
                                }
                                throw insErr;
                            }
                            sessionId = newSess.id;
                        }
                        sessionCache.set(cacheKey, sessionId!);
                    }

                    // 3. Upsert Record
                    const { error: recErr } = await supabase
                        .from('attendance_records')
                        .upsert({
                            session_id: sessionId,
                            student_id: student.id,
                            status: status.toLowerCase(),
                            marked_at: new Date().toISOString()
                        }, { onConflict: 'session_id, student_id' });

                    if (recErr) throw recErr;

                    report.success++;
                    report.details.push({ student_code, status: 'SUCCESS' });
                } catch (err: any) {
                    report.failure++;
                    report.details.push({ student_code, status: 'FAILURE', reason: err.message });
                }
            }

            await supabase.from('academic_automation_logs').insert({
                school_id: schoolId,
                action: 'BULK_ATTENDANCE_SEED',
                details: { success: report.success, year: academic_year_id },
                performed_by: userId
            });

            res.json(report);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ======================================
// 4. BULK FEES (ADMIN SEED)
// ======================================
// CSV: student_code, fee_type, amount, paid_amount, remarks
bulkRouter.post('/fees/seed',
    blockInProduction,
    upload.single('file'),
    checkPermission(PERMISSIONS.DASHBOARD_VIEW_ADMIN),
    async (req: Request, res: Response) => {
        if (!req.file) return res.status(400).json({ error: "File is required" });
        const schoolId = req.context!.user.school_id;
        try {
            const rows = parseFile(req.file);
            const report = { total: rows.length, success: 0, failure: 0, details: [] as any[] };

            const detectTerm = (name: string): string => {
                const n = name.toUpperCase();
                if (n.includes('Q1')) return 'Q1';
                if (n.includes('Q2')) return 'Q2';
                if (n.includes('Q3')) return 'Q3';
                if (n.includes('Q4')) return 'Q4';
                return 'ANNUAL';
            };

            for (const row of rows) {
                let student_code = row.student_code;
                try {
                    const { fee_type, amount, paid_amount, remarks } = row;
                    const academicYearId = req.body.academic_year_id;
                    if (!academicYearId) throw new Error("academic_year_id is required");

                    const { data: student } = await supabase.from('students').select('id').eq('student_code', student_code).eq('school_id', schoolId).single();
                    if (!student) throw new Error("Student not found");

                    const term = detectTerm(fee_type);

                    // 1. Resolve or Create Fee Structure
                    let { data: structure } = await supabase
                        .from('fee_structures')
                        .select('id')
                        .eq('school_id', schoolId)
                        .eq('academic_year_id', academicYearId)
                        .eq('name', fee_type)
                        .maybeSingle();

                    if (!structure) {
                        const { data: newStructure, error: structError } = await supabase
                            .from('fee_structures')
                            .insert({
                                school_id: schoolId,
                                academic_year_id: academicYearId,
                                name: fee_type,
                                amount: amount,
                                term: term
                            })
                            .select('id')
                            .single();

                        if (structError) throw structError;
                        structure = newStructure;
                    }

                    // 2. Assign Fee to Student
                    const { data: sFee, error: sFeeErr } = await supabase.from('student_fees').upsert({
                        student_id: student.id,
                        fee_structure_id: structure!.id,
                        assigned_amount: amount
                    }, { onConflict: 'student_id, fee_structure_id' }).select('id').single();

                    if (sFeeErr) throw sFeeErr;

                    // 3. Record Payment if paid_amount > 0 (Using Atomic Allocation RPC)
                    if (Number(paid_amount) > 0) {
                        const { error: payError } = await supabase.rpc('fn_record_payment_with_allocation', {
                            p_student_id: student.id,
                            p_amount: Number(paid_amount),
                            p_mode: 'cash',
                            p_ref: `BULK_SEED_${Date.now()}`,
                            p_remarks: `TEST_ADMIN_SEED: ${remarks}`,
                            p_fee_ids: [sFee.id] // Explicitly allocate to this fee
                        });

                        if (payError) throw payError;
                    }

                    report.success++;
                    report.details.push({ student_code, status: 'SUCCESS' });
                } catch (err: any) {
                    report.failure++;
                    report.details.push({ student_code, status: 'FAILURE', reason: err.message });
                }
            }

            await supabase.from('academic_automation_logs').insert({
                school_id: schoolId,
                action: 'BULK_FEES_SEED',
                details: { success: report.success },
                performed_by: req.context!.user.id
            });

            res.json(report);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);

/**
 * 4. ATOMIC DETERMINISTIC DISTRIBUTION
 * For Each Class:
 *   Sort Students by student_code
 *   Split: First 15 -> Section A, Next 15 -> Section B (Transactional)
 */
bulkRouter.post('/class/auto-distribute',
    checkPermission(PERMISSIONS.STUDENT_ASSIGN_SECTION),
    async (req: Request, res: Response) => {
        const { classId, academicYearId } = req.body;
        const schoolId = req.context!.user.school_id;
        const userId = req.context!.user.id;

        if (!classId || !academicYearId) return res.status(400).json({ error: "classId and academicYearId required" });

        try {
            await checkYearNotClosed(academicYearId);

            // Call Atomic RPC
            const { data, error } = await supabase.rpc('fn_auto_distribute_class', {
                p_school_id: schoolId,
                p_class_id: classId,
                p_academic_year_id: academicYearId,
                p_performed_by: userId
            });

            if (error) {
                if (error.message?.includes('CLASS_FULL')) {
                    return res.status(422).json({ error: error.message });
                }
                throw error;
            }

            res.json(data);

        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
);
