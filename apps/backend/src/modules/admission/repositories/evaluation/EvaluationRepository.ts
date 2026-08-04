import { supabase } from '../../../../config/supabase';

export class EvaluationRepository {
    public async getEvaluationSummary(applicationId: string): Promise<any> {
        // Query exam candidate status
        const { data: candidate, error: candidateErr } = await supabase
            .from('admission_exam_session_candidates')
            .select('*, admission_exam_schedule(*)')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (candidateErr) throw candidateErr;

        let examResult = null;
        if (candidate) {
            const { data: results, error: resultsErr } = await supabase
                .from('admission_exam_results')
                .select('*')
                .eq('candidate_id', candidate.id);

            if (resultsErr) throw resultsErr;
            examResult = results || [];
        }

        // Query interviews status
        const { data: interview, error: interviewErr } = await supabase
            .from('admission_interviews')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (interviewErr) throw interviewErr;

        let interviewScores = null;
        if (interview) {
            const { data: scores, error: scoresErr } = await supabase
                .from('admission_interview_scores')
                .select('*')
                .eq('interview_id', interview.id);

            if (scoresErr) throw scoresErr;
            interviewScores = scores || [];
        }

        // Query merit placement status
        const { data: merit, error: meritErr } = await supabase
            .from('admission_merit_results')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (meritErr) throw meritErr;

        // Query offers status
        const { data: offer, error: offerErr } = await supabase
            .from('admission_offer_letters')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (offerErr) throw offerErr;

        return {
            application_id: applicationId,
            exam: candidate ? {
                session_id: candidate.session_id,
                invigilator: candidate.admission_exam_schedule?.invigilator_name,
                room: candidate.admission_exam_schedule?.room_name,
                status: candidate.admission_exam_schedule?.status,
                attendance: candidate.attendance_status,
                hall_ticket_number: candidate.hall_ticket_number,
                results: examResult
            } : null,
            interview: interview ? {
                interview_id: interview.id,
                panel_id: interview.panel_id,
                room: interview.room_name,
                status: interview.status,
                remarks: interview.remarks,
                scores: interviewScores
            } : null,
            merit: merit ? {
                final_score: Number(merit.final_score),
                rank: merit.rank,
                status: merit.selection_status,
                waitlist_priority: merit.waitlist_priority,
                waitlist_group: merit.waitlist_group
            } : null,
            offer: offer ? {
                offer_number: offer.offer_number,
                status: offer.status,
                issue_date: offer.issue_date,
                expiry_date: offer.expiry_date
            } : null
        };
    }
}
