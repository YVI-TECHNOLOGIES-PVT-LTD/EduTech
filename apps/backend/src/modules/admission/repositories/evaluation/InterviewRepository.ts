import { Interview, InterviewStatus } from '../../domain/evaluation/Interview';
import { InterviewScore } from '../../domain/evaluation/InterviewScore';
import { supabase } from '../../../../config/supabase';

export class InterviewRepository {
    public async findById(id: string): Promise<Interview | null> {
        const { data, error } = await supabase
            .from('admission_interviews')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new Interview(
            data.id,
            data.application_id,
            data.panel_id,
            new Date(data.interview_date),
            data.room_name,
            data.status as InterviewStatus,
            data.remarks,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async findByApplicationId(applicationId: string): Promise<Interview | null> {
        const { data, error } = await supabase
            .from('admission_interviews')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

        if (error) throw error;
        return data ? new Interview(
            data.id,
            data.application_id,
            data.panel_id,
            new Date(data.interview_date),
            data.room_name,
            data.status as InterviewStatus,
            data.remarks,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async save(interview: Interview): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async saveScore(score: InterviewScore): Promise<void> {
        const { error } = await supabase
            .from('admission_interview_scores')
            .upsert({
                id: score.id,
                interview_id: score.interviewId,
                criterion_id: score.criterionId,
                score: score.score,
                remarks: score.remarks
            });

        if (error) throw error;
    }

    public async findScoresByInterviewId(interviewId: string): Promise<InterviewScore[]> {
        const { data, error } = await supabase
            .from('admission_interview_scores')
            .select('*')
            .eq('interview_id', interviewId);

        if (error) throw error;
        return (data || []).map(row => new InterviewScore(
            row.id,
            row.interview_id,
            row.criterion_id,
            Number(row.score),
            row.remarks,
            new Date(row.created_at)
        ));
    }

    public async findCriteria(): Promise<any[]> {
        const { data, error } = await supabase
            .from('admission_interview_criteria')
            .select('*')
            .eq('active', true);

        if (error) throw error;
        return data || [];
    }

    public async findPanelById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('admission_interview_panels')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    public async savePanel(panel: any): Promise<void> {
        const { error } = await supabase
            .from('admission_interview_panels')
            .upsert({
                id: panel.id,
                panel_name: panel.panel_name,
                members: panel.members
            });

        if (error) throw error;
    }

    public async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('interview_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data ? data.allowed : false;
    }
}
