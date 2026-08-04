"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamEligibilityService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamEligibilityService = {
    async checkEligibility(studentId, examId) {
        // 1. Get Exam Context (Academic Year + Term + Snapshot status)
        const { data: exam, error: examError } = await supabase_1.supabase
            .from('exams')
            .select('id, academic_year_id, term, eligibility_frozen')
            .eq('id', examId)
            .single();
        if (examError || !exam)
            throw new Error("Exam not found");
        // 2. CHECK SNAPSHOT FIRST (If Frozen)
        if (exam.eligibility_frozen) {
            const { data: snapshot } = await supabase_1.supabase
                .from('exam_eligibility_snapshots')
                .select('eligible, attendance_percentage, fees_status, reasons, source')
                .eq('exam_id', examId)
                .eq('student_id', studentId)
                .maybeSingle();
            if (snapshot) {
                return {
                    eligible: snapshot.eligible,
                    attendance_percentage: Number(snapshot.attendance_percentage),
                    fees_status: snapshot.fees_status,
                    reasons: snapshot.reasons,
                    source: snapshot.source
                };
            }
        }
        const reasons = [];
        let eligible = true;
        // 3. BRIDGE CHECK: ATTENDANCE & FEES (Admin/Bootstrap Overrides)
        // Check caches first to see if authoritative data exists
        const { data: attCache } = await supabase_1.supabase
            .from('student_attendance_cache')
            .select('attendance_percentage, source')
            .eq('student_id', studentId)
            .eq('academic_year_id', exam.academic_year_id)
            .maybeSingle();
        const { data: feeCache } = await supabase_1.supabase
            .from('student_fee_clearance_cache')
            .select('is_cleared, fee_status, source')
            .eq('student_id', studentId)
            .eq('academic_year_id', exam.academic_year_id)
            .maybeSingle();
        // ----------------------------------------------------
        // ATTENDANCE RESOLUTION
        // ----------------------------------------------------
        let attendancePercentage;
        // Use Cache if source is ADMIN, BOOTSTRAP, or SYSTEM (Trusted)
        // Or if local policy dictates we always prefer cache
        if (attCache && ['ADMIN', 'BOOTSTRAP', 'SYSTEM'].includes(attCache.source)) {
            attendancePercentage = Number(attCache.attendance_percentage);
        }
        else {
            // Fallback to Live Calculation
            const { data: records, error: attError } = await supabase_1.supabase
                .from('attendance_records')
                .select(`
                    status,
                    session:session_id!inner(academic_year_id)
                `)
                .eq('student_id', studentId)
                .eq('session.academic_year_id', exam.academic_year_id);
            if (attError)
                throw attError;
            let totalSessions = records?.length || 0;
            let attendedSessions = records?.filter((r) => ['present', 'late', 'excused'].includes(r.status?.toLowerCase())).length || 0;
            attendancePercentage = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 100;
        }
        if (attendancePercentage < 75) {
            eligible = false;
            reasons.push(`Low Attendance: ${attendancePercentage.toFixed(1)}% (Req: 75%)`);
        }
        // ----------------------------------------------------
        // FEES RESOLUTION
        // ----------------------------------------------------
        let isFeeCleared = false;
        let feeStatusDisplay = 'PENDING';
        if (feeCache && ['ADMIN', 'BOOTSTRAP', 'REAL'].includes(feeCache.source)) {
            // Use Cache
            isFeeCleared = feeCache.is_cleared;
            feeStatusDisplay = feeCache.fee_status || (isFeeCleared ? 'CLEARED' : 'PENDING');
            if (!isFeeCleared)
                reasons.push(`Fees Pending (Source: ${feeCache.source})`);
        }
        else {
            // Fallback to Live Calculation (Term Specific)
            const { data: feeAssignments, error: feeError } = await supabase_1.supabase
                .from('student_fees')
                .select(`
                    assigned_amount, paid_amount, fee_status,
                    structure:fee_structure_id!inner(term)
                `)
                .eq('student_id', studentId)
                .eq('structure.term', exam.term);
            if (feeError)
                throw feeError;
            const pendingFees = feeAssignments?.filter(f => f.fee_status !== 'PAID') || [];
            isFeeCleared = pendingFees.length === 0;
            if (!isFeeCleared) {
                const balance = pendingFees.reduce((sum, f) => sum + (Number(f.assigned_amount) - Number(f.paid_amount)), 0);
                reasons.push(`Pending ${exam.term} Fees: ${balance.toFixed(2)} remaining`);
            }
        }
        if (!isFeeCleared)
            eligible = false;
        return {
            eligible,
            attendance_percentage: parseFloat(attendancePercentage.toFixed(1)),
            fees_status: isFeeCleared ? 'CLEARED' : 'PENDING',
            reasons,
            source: (() => {
                if (attCache?.source === 'ADMIN' || feeCache?.source === 'ADMIN')
                    return 'OVERRIDE';
                if (attCache?.source === 'BOOTSTRAP' || feeCache?.source === 'BOOTSTRAP')
                    return 'BOOTSTRAP';
                if (attCache?.source === 'REAL' || feeCache?.source === 'REAL')
                    return 'REAL';
                return undefined;
            })()
        };
    },
    /**
     * Bulk check with snapshot support
     */
    async checkEligibilityBulk(studentIds, examId) {
        const results = {};
        if (studentIds.length === 0)
            return results;
        // 1. Get Exam Context
        const { data: exam, error: examError } = await supabase_1.supabase
            .from('exams')
            .select('academic_year_id, term, eligibility_frozen')
            .eq('id', examId)
            .single();
        if (examError || !exam)
            throw new Error("Exam not found");
        // 2. Try Snapshots First
        if (exam.eligibility_frozen) {
            const { data: snapshots } = await supabase_1.supabase
                .from('exam_eligibility_snapshots')
                .select('student_id, eligible, attendance_percentage, fees_status, reasons, source, promoted_to_seating')
                .eq('exam_id', examId)
                .in('student_id', studentIds);
            if (snapshots && snapshots.length > 0) {
                snapshots.forEach(s => {
                    results[s.student_id] = {
                        eligible: s.eligible,
                        attendance_percentage: Number(s.attendance_percentage),
                        fees_status: s.fees_status,
                        reasons: s.reasons,
                        source: s.source,
                        promoted_to_seating: s.promoted_to_seating // Added
                    };
                });
                // If all found, return
                if (snapshots.length === studentIds.length)
                    return results;
            }
        }
        // 3. BRIDGE CHECK: Check Caches (Admin/Bootstrap) for missing students
        const missingIds = studentIds.filter(id => !results[id]);
        if (missingIds.length === 0)
            return results;
        const { data: attCaches } = await supabase_1.supabase
            .from('student_attendance_cache')
            .select('student_id, attendance_percentage, source')
            .eq('academic_year_id', exam.academic_year_id)
            .in('student_id', missingIds);
        const { data: feeCaches } = await supabase_1.supabase
            .from('student_fee_clearance_cache')
            .select('student_id, is_cleared, fee_status, source')
            .eq('academic_year_id', exam.academic_year_id)
            .in('student_id', missingIds);
        const attMap = new Map(attCaches?.map(a => [a.student_id, a]));
        const feeMap = new Map(feeCaches?.map(f => [f.student_id, f]));
        // Identify which students are fully resolved via cache
        // We resolve if EITHER is overridden by Admin, OR if we trust the cache
        // Currently, we will use cache if available.
        // We need to know who is STILL missing (i.e. partial cache or no cache)
        // Actually, if partial cache (e.g. attendance cached but fees not), we need to mix.
        // This makes bulk logic complex.
        // Simplified Strategy for this Phase: 
        // 1. Fetch Live Data for ALL missingIds (fallback).
        // 2. Overlay Cache Data if exists.
        // [ATTENDANCE LIVE BULK]
        const { data: records } = await supabase_1.supabase
            .from('attendance_records')
            .select('student_id, status, session:session_id!inner(academic_year_id)')
            .in('student_id', missingIds)
            .eq('session.academic_year_id', exam.academic_year_id);
        // [FEES LIVE BULK]
        const { data: fees } = await supabase_1.supabase
            .from('student_fees')
            .select('student_id, assigned_amount, paid_amount, fee_status, structure:fee_structure_id!inner(term)')
            .in('student_id', missingIds)
            .eq('structure.term', exam.term);
        missingIds.forEach(sid => {
            const reasons = [];
            let eligible = true;
            let source = undefined;
            // --- ATTENDANCE ---
            let attPct = 100;
            const cacheAtt = attMap.get(sid);
            if (cacheAtt && ['ADMIN', 'BOOTSTRAP', 'SYSTEM'].includes(cacheAtt.source)) {
                attPct = Number(cacheAtt.attendance_percentage);
                if (cacheAtt.source === 'ADMIN')
                    source = 'OVERRIDE';
            }
            else {
                // Live Calc
                const sRecords = records?.filter(r => r.student_id === sid) || [];
                const totalSessions = sRecords.length;
                const attended = sRecords.filter(r => ['present', 'late', 'excused'].includes(r.status.toLowerCase())).length;
                attPct = totalSessions > 0 ? (attended / totalSessions) * 100 : 100;
            }
            if (attPct < 75) {
                eligible = false;
                reasons.push(`Low Attendance: ${attPct.toFixed(1)}%`);
            }
            // --- FEES ---
            let feeCleared = false;
            const cacheFee = feeMap.get(sid);
            if (cacheFee && ['ADMIN', 'BOOTSTRAP', 'REAL'].includes(cacheFee.source)) {
                feeCleared = cacheFee.is_cleared;
                if (!feeCleared)
                    reasons.push(`Fees Pending`);
                if (cacheFee.source === 'ADMIN')
                    source = 'OVERRIDE';
            }
            else {
                // Live Calc
                const sFees = fees?.filter(f => f.student_id === sid) || [];
                const pending = sFees.filter(f => f.fee_status !== 'PAID');
                feeCleared = pending.length === 0;
                if (!feeCleared) {
                    const bal = pending.reduce((sum, f) => sum + (Number(f.assigned_amount) - Number(f.paid_amount)), 0);
                    reasons.push(`Pending Fees: ${bal.toFixed(2)}`);
                }
            }
            if (!feeCleared)
                eligible = false;
            // Determine effective source
            if (!source) {
                if (cacheAtt?.source === 'BOOTSTRAP' || cacheFee?.source === 'BOOTSTRAP')
                    source = 'BOOTSTRAP';
                else if (cacheAtt?.source === 'REAL' || cacheFee?.source === 'REAL')
                    source = 'REAL';
            }
            results[sid] = {
                eligible,
                attendance_percentage: parseFloat(attPct.toFixed(1)),
                fees_status: feeCleared ? 'CLEARED' : 'PENDING',
                reasons,
                source
            };
        });
        return results;
    },
    /**
     * Fetch classes applicable to an exam
     */
    async getClassesForExam(examId) {
        // 1. Get Exam Record
        const { data: exam, error: examErr } = await supabase_1.supabase
            .from('exams')
            .select('applicable_classes')
            .eq('id', examId)
            .single();
        if (examErr || !exam)
            throw new Error("Exam not found or invalid.");
        // 2. Resolve Classes
        let query = supabase_1.supabase
            .from('classes')
            .select('id, name')
            .order('name', { ascending: true });
        if (exam.applicable_classes && exam.applicable_classes.length > 0) {
            query = query.in('id', exam.applicable_classes);
        }
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
};
