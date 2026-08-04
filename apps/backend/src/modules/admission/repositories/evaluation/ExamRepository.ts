import { IExamRepository } from './interfaces/IExamRepository';
import { ExamTemplate } from '../../domain/evaluation/ExamTemplate';
import { ExamSchedule, ExamStatus } from '../../domain/evaluation/ExamSchedule';
import { ExamResult } from '../../domain/evaluation/ExamResult';
import { HallTicket } from '../../domain/evaluation/HallTicket';
import { supabase } from '../../../../config/supabase';

export class ExamRepository implements IExamRepository {
    public async findTemplateById(id: string): Promise<ExamTemplate | null> {
        const { data, error } = await supabase
            .from('admission_exam_templates')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new ExamTemplate(data.id, data.name, data.grade, data.duration, data.total_marks, data.passing_marks, new Date(data.created_at), new Date(data.updated_at)) : null;
    }

    public async findTemplateByGrade(grade: string): Promise<ExamTemplate | null> {
        const { data, error } = await supabase
            .from('admission_exam_templates')
            .select('*')
            .eq('grade', grade)
            .maybeSingle();

        if (error) throw error;
        return data ? new ExamTemplate(data.id, data.name, data.grade, data.duration, data.total_marks, data.passing_marks, new Date(data.created_at), new Date(data.updated_at)) : null;
    }

    public async saveTemplate(template: ExamTemplate): Promise<void> {
        const { error } = await supabase
            .from('admission_exam_templates')
            .upsert({
                id: template.id,
                name: template.name,
                grade: template.grade,
                duration: template.duration,
                total_marks: template.totalMarks,
                passing_marks: template.passingMarks
            });

        if (error) throw error;
    }

    public async findScheduleById(id: string): Promise<ExamSchedule | null> {
        const { data, error } = await supabase
            .from('admission_exam_schedule')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new ExamSchedule(
            data.id,
            data.template_id,
            data.school_id,
            data.academic_year_id,
            data.room_name,
            data.invigilator_name,
            new Date(data.exam_date),
            data.status as ExamStatus,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async saveSchedule(schedule: ExamSchedule): Promise<void> {
        const { error } = await supabase
            .from('admission_exam_schedule')
            .upsert({
                id: schedule.id,
                template_id: schedule.templateId,
                school_id: schedule.schoolId,
                academic_year_id: schedule.academicYearId,
                room_name: schedule.roomName,
                invigilator_name: schedule.invigilatorName,
                exam_date: schedule.examDate.toISOString(),
                status: schedule.status,
                updated_at: schedule.updatedAt.toISOString()
            });

        if (error) throw error;
    }

    public async findCandidate(sessionId: string, applicationId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_exam_session_candidates')
            .select('*')
            .eq('session_id', sessionId)
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findCandidateById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_exam_session_candidates')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findCandidateByApplicationId(applicationId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_exam_session_candidates')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async saveCandidate(candidate: any): Promise<void> {
        const { error } = await supabase
            .from('admission_exam_session_candidates')
            .upsert({
                id: candidate.id,
                session_id: candidate.session_id,
                application_id: candidate.application_id,
                hall_ticket_number: candidate.hall_ticket_number,
                seat_number: candidate.seat_number,
                attendance_status: candidate.attendance_status,
                remarks: candidate.remarks
            });

        if (error) throw error;
    }

    public async findSubjectsByTemplateId(templateId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('admission_exam_subjects')
            .select('*')
            .eq('template_id', templateId);

        if (error) throw error;
        return data || [];
    }

    public async saveResult(result: ExamResult): Promise<void> {
        const { error } = await supabase
            .from('admission_exam_results')
            .upsert({
                id: result.id,
                candidate_id: result.candidateId,
                subject_id: result.subjectId,
                marks_obtained: result.marksObtained,
                percentage: result.percentage,
                pass: result.pass,
                evaluator_id: result.evaluatorId,
                updated_at: result.updatedAt.toISOString()
            });

        if (error) throw error;
    }

    public async findResultsByCandidateId(candidateId: string): Promise<ExamResult[]> {
        const { data, error } = await supabase
            .from('admission_exam_results')
            .select('*')
            .eq('candidate_id', candidateId);

        if (error) throw error;
        return (data || []).map(row => new ExamResult(
            row.id,
            row.candidate_id,
            row.subject_id,
            Number(row.marks_obtained),
            Number(row.percentage),
            row.pass,
            row.evaluator_id,
            new Date(row.created_at),
            new Date(row.updated_at)
        ));
    }

    public async saveHallTicket(ticket: HallTicket): Promise<void> {
        const { error } = await supabase
            .from('admission_hall_tickets')
            .upsert({
                id: ticket.id,
                application_id: ticket.applicationId,
                exam_schedule_id: ticket.examScheduleId,
                hall_ticket_number: ticket.hallTicketNumber,
                exam_room: ticket.examRoom,
                reporting_time: ticket.reportingTime.toISOString(),
                qr_code_path: ticket.qrCodePath
            });

        if (error) throw error;
    }

    public async findHallTicketByApplicationId(applicationId: string): Promise<HallTicket | null> {
        const { data, error } = await supabase
            .from('admission_hall_tickets')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data ? new HallTicket(
            data.id,
            data.application_id,
            data.exam_schedule_id,
            data.hall_ticket_number,
            data.exam_room,
            new Date(data.reporting_time),
            data.qr_code_path,
            new Date(data.created_at)
        ) : null;
    }

    public async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('exam_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data ? data.allowed : false;
    }

    // Assessment Engine
    public async findPolicyByScheduleId(scheduleId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_assessment_policies')
            .select('*')
            .eq('schedule_id', scheduleId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findSessionById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_assessment_sessions')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findSessionByCandidateId(candidateId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_assessment_sessions')
            .select('*')
            .eq('candidate_allocation_id', candidateId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async saveSession(session: any): Promise<void> {
        const { error } = await supabase
            .from('admission_assessment_sessions')
            .upsert({
                id: session.id,
                school_id: session.school_id,
                candidate_allocation_id: session.candidate_allocation_id,
                otp_hash: session.otp_hash,
                otp_expires_at: session.otp_expires_at,
                exam_token_hash: session.exam_token_hash,
                ip_address: session.ip_address,
                browser_agent: session.browser_agent,
                last_heartbeat_at: session.last_heartbeat_at,
                status: session.status
            });

        if (error) throw error;
    }

    public async findAttemptById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_assessment_attempts')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async findAttemptBySessionId(sessionId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_assessment_attempts')
            .select('*')
            .eq('session_id', sessionId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async saveAttempt(attempt: any): Promise<void> {
        const { error } = await supabase
            .from('admission_assessment_attempts')
            .upsert({
                id: attempt.id,
                school_id: attempt.school_id,
                session_id: attempt.session_id,
                snapshot_id: attempt.snapshot_id,
                start_time: attempt.start_time,
                submit_time: attempt.submit_time,
                status: attempt.status,
                evaluation_status: attempt.evaluation_status,
                score_obtained: attempt.score_obtained
            });

        if (error) throw error;
    }

    public async createSnapshot(templateId: string, schoolId: string): Promise<string> {
        const { data: template, error: tempErr } = await supabase
            .from('admission_exam_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (tempErr) throw tempErr;

        const { data: snapshot, error: snapErr } = await supabase
            .from('admission_assessment_snapshots')
            .insert({
                school_id: schoolId,
                template_id: templateId,
                name: template.name,
                grade: template.grade,
                version: template.version,
                duration: template.duration,
                total_marks: template.total_marks,
                passing_marks: template.passing_marks,
                evaluation_type: template.evaluation_type
            })
            .select()
            .single();

        if (snapErr) throw snapErr;

        const { data: sections, error: secErr } = await supabase
            .from('admission_assessment_sections')
            .select('*')
            .eq('template_id', templateId);

        if (secErr) throw secErr;

        for (const sec of sections || []) {
            const { data: mappings, error: mapErr } = await supabase
                .from('admission_assessment_question_mapping')
                .select('*')
                .eq('section_id', sec.id);

            if (mapErr) throw mapErr;

            for (const map of mappings || []) {
                const { data: question, error: qErr } = await supabase
                    .from('admission_question_bank')
                    .select('*')
                    .eq('id', map.question_id)
                    .single();

                if (qErr) throw qErr;

                const { data: snapQuest, error: snapQErr } = await supabase
                    .from('admission_assessment_snapshot_questions')
                    .insert({
                        snapshot_id: snapshot.id,
                        question_id: question.id,
                        section_name: sec.section_name,
                        question_text: question.question_text,
                        question_type: question.question_type,
                        points: question.points,
                        negative_marks: question.negative_marks,
                        sort_order: map.sort_order
                    })
                    .select()
                    .single();

                if (snapQErr) throw snapQErr;

                const { data: options, error: optErr } = await supabase
                    .from('admission_question_options')
                    .select('*')
                    .eq('question_id', question.id);

                if (optErr) throw optErr;

                for (const opt of options || []) {
                    const { error: snapOptErr } = await supabase
                        .from('admission_assessment_snapshot_question_options')
                        .insert({
                            snapshot_question_id: snapQuest.id,
                            option_text: opt.option_text,
                            is_correct: opt.is_correct
                        });

                    if (snapOptErr) throw snapOptErr;
                }
            }
        }

        return snapshot.id;
    }

    public async findSnapshotQuestions(snapshotId: string): Promise<any[]> {
        const { data: questions, error: qErr } = await supabase
            .from('admission_assessment_snapshot_questions')
            .select('*')
            .eq('snapshot_id', snapshotId)
            .order('sort_order', { ascending: true });

        if (qErr) throw qErr;

        const results: any[] = [];
        for (const q of questions || []) {
            const { data: options, error: optErr } = await supabase
                .from('admission_assessment_snapshot_question_options')
                .select('*')
                .eq('snapshot_question_id', q.id);

            if (optErr) throw optErr;

            results.push({
                ...q,
                options: (options || []).map(opt => ({
                    id: opt.id,
                    option_text: opt.option_text
                    // Omit correct flag for security in candidate workspace
                }))
            });
        }

        return results;
    }

    public async saveResponses(attemptId: string, responses: any[]): Promise<void> {
        for (const res of responses) {
            const { error } = await supabase
                .from('admission_assessment_responses')
                .upsert({
                    attempt_id: attemptId,
                    snapshot_question_id: res.snapshot_question_id,
                    selected_option_id: res.selected_option_id || null,
                    text_answer: res.text_answer || null,
                    time_spent_seconds: res.time_spent_seconds || 0
                });

            if (error) throw error;
        }
    }

    public async saveEvent(sessionId: string, eventType: string, details: any): Promise<void> {
        const { error } = await supabase
            .from('admission_assessment_events')
            .insert({
                session_id: sessionId,
                event_type: eventType,
                details: details || {}
            });

        if (error) throw error;
    }

    public async saveOutbox(schoolId: string, eventType: string, payload: any): Promise<void> {
        const { error } = await supabase
            .from('admission_assessment_outbox')
            .insert({
                school_id: schoolId,
                event_type: eventType,
                payload: payload
            });

        if (error) throw error;
    }
}
