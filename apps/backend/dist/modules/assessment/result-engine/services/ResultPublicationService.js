"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultPublicationService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const PublicationRepository_1 = require("../repositories/PublicationRepository");
const ResultRepository_1 = require("../repositories/ResultRepository");
const StudentResultRepository_1 = require("../repositories/StudentResultRepository");
const supabase_1 = require("../../../../config/supabase");
const crypto_1 = require("crypto");
class ResultPublicationService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new PublicationRepository_1.PublicationRepository();
        this.sessionRepo = new ResultRepository_1.ResultRepository();
        this.studentResultsRepo = new StudentResultRepository_1.StudentResultRepository();
    }
    async publishResults(sessionId, schoolId, targetPortal, userId, correlationId) {
        this.logInfo(`Publishing calculations snapshots and locking results for session: ${sessionId}`, correlationId);
        // Fetch students dynamic calculations results
        const results = await this.studentResultsRepo.listResultsBySession(sessionId);
        // Fetch session term details
        const session = await this.sessionRepo.findSessionById(sessionId, schoolId);
        if (!session)
            throw new Error('Session details not found.');
        // 1. Save immutable official snapshots records
        for (const res of results) {
            const resultStr = JSON.stringify({
                student_id: res.student_id,
                gpa: res.gpa,
                cgpa: res.cgpa,
                credits: res.total_credits
            });
            const signedHash = (0, crypto_1.createHash)('sha256').update(resultStr + userId).digest('hex');
            const { data: officialResult, error: offErr } = await supabase_1.supabase
                .from('assessment_official_results')
                .insert({
                school_id: schoolId,
                student_id: res.student_id,
                academic_year_id: session.academic_year_id,
                term_id: session.term_id,
                final_percentage: res.final_percentage,
                gpa: res.gpa,
                cgpa: res.cgpa,
                total_credits: res.total_credits,
                signed_hash: signedHash
            })
                .select()
                .single();
            if (offErr)
                throw offErr;
            // Copy subjects list
            for (const sub of res.subject_results || []) {
                await supabase_1.supabase
                    .from('assessment_official_subject_results')
                    .insert({
                    official_result_id: officialResult.id,
                    subject_id: sub.subject_id,
                    awarded_marks: sub.awarded_marks,
                    maximum_marks: sub.maximum_marks,
                    grade_label: sub.grade_label,
                    grade_point: sub.grade_point
                });
            }
            // Save official gradecard snapshot
            const gcChecksum = (0, crypto_1.createHash)('sha256').update(officialResult.id + signedHash).digest('hex');
            await supabase_1.supabase
                .from('assessment_official_gradecards')
                .insert({
                official_result_id: officialResult.id,
                gradecard_pdf_url: `/exports/official_gradecard_${officialResult.id}.pdf`,
                checksum: gcChecksum
            });
        }
        // Save publication details
        const pub = await this.repo.publishResultPortal(sessionId, targetPortal, userId);
        // Save freeze logs & signatures
        await supabase_1.supabase
            .from('assessment_result_freeze_logs')
            .insert({ session_id: sessionId, frozen_by: userId });
        await supabase_1.supabase
            .from('assessment_result_signatures')
            .insert({
            session_id: sessionId,
            system_hash: (0, crypto_1.createHash)('sha256').update(sessionId + targetPortal).digest('hex')
        });
        // Set session status to PUBLISHED & LOCKED
        await this.sessionRepo.updateStatus(sessionId, 'LOCKED');
        return pub;
    }
}
exports.ResultPublicationService = ResultPublicationService;
exports.default = ResultPublicationService;
