"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewRepository = void 0;
const Interview_1 = require("../../domain/evaluation/Interview");
const InterviewScore_1 = require("../../domain/evaluation/InterviewScore");
const supabase_1 = require("../../../../config/supabase");
class InterviewRepository {
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('admission_interviews')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Interview_1.Interview(data.id, data.application_id, data.panel_id, new Date(data.interview_date), data.room_name, data.status, data.remarks, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async findByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_interviews')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Interview_1.Interview(data.id, data.application_id, data.panel_id, new Date(data.interview_date), data.room_name, data.status, data.remarks, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async save(interview) {
        const { error } = await supabase_1.supabase
            .from('admission_interviews')
            .upsert({
            id: interview.id,
            application_id: interview.applicationId,
            panel_id: interview.panelId,
            interview_date: interview.interviewDate.toISOString(),
            room_name: interview.roomName,
            status: interview.status,
            remarks: interview.remarks,
            updated_at: interview.updatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async saveScore(score) {
        const { error } = await supabase_1.supabase
            .from('admission_interview_scores')
            .upsert({
            id: score.id,
            interview_id: score.interviewId,
            criterion_id: score.criterionId,
            score: score.score,
            remarks: score.remarks
        });
        if (error)
            throw error;
    }
    async findScoresByInterviewId(interviewId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_interview_scores')
            .select('*')
            .eq('interview_id', interviewId);
        if (error)
            throw error;
        return (data || []).map(row => new InterviewScore_1.InterviewScore(row.id, row.interview_id, row.criterion_id, Number(row.score), row.remarks, new Date(row.created_at)));
    }
    async findCriteria() {
        const { data, error } = await supabase_1.supabase
            .from('admission_interview_criteria')
            .select('*')
            .eq('active', true);
        if (error)
            throw error;
        return data || [];
    }
    async findPanelById(id) {
        const { data, error } = await supabase_1.supabase
            .from('admission_interview_panels')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async savePanel(panel) {
        const { error } = await supabase_1.supabase
            .from('admission_interview_panels')
            .upsert({
            id: panel.id,
            panel_name: panel.panel_name,
            members: panel.members
        });
        if (error)
            throw error;
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const { data, error } = await supabase_1.supabase
            .from('interview_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();
        if (error)
            throw error;
        return data ? data.allowed : false;
    }
}
exports.InterviewRepository = InterviewRepository;
