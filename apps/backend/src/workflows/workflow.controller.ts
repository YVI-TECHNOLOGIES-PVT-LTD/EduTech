import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { WorkflowService } from './workflow.service';

export class WorkflowController {
    
    static async listWorkflows(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from('workflows')
                .select('*, workflow_versions(*)');
            if (error) throw error;
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async createWorkflow(req: Request, res: Response) {
        try {
            const { name, code, description, is_template } = req.body;
            const { data, error } = await supabase
                .from('workflows')
                .insert({ name, code, description, is_template: is_template || false })
                .select()
                .single();
            if (error) throw error;
            res.status(201).json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async cloneWorkflow(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { new_name, new_code } = req.body;
            if (!new_name || !new_code) return res.status(400).json({ error: "Missing parameters: new_name and new_code" });

            const cloned = await WorkflowService.cloneWorkflow(id, new_name, new_code);
            res.json(cloned);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getRuns(req: Request, res: Response) {
        try {
            const schoolId = req.context?.user?.school_id;
            let query = supabase.from('workflow_runs').select('*, workflow_versions(workflows(*))');
            if (schoolId) query = query.eq('school_id', schoolId);

            const { data, error } = await query;
            if (error) throw error;
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async submitDecision(req: Request, res: Response) {
        try {
            const { runId, nodeId } = req.params;
            const { decision, remarks } = req.body;
            const userId = req.context?.user?.id;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            if (!decision || !['approved', 'rejected'].includes(decision)) {
                return res.status(400).json({ error: "Decision must be 'approved' or 'rejected'" });
            }

            const outcome = await WorkflowService.submitDecision(runId, nodeId, userId, decision, remarks || '');
            res.json(outcome);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getLogs(req: Request, res: Response) {
        try {
            const { runId } = req.params;
            const { data, error } = await supabase
                .from('workflow_logs')
                .select('*, performed_by:performed_by(full_name)')
                .eq('workflow_run_id', runId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            res.json(data);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    static async getAnalytics(req: Request, res: Response) {
        try {
            const schoolId = req.context?.user?.school_id;
            
            let query = supabase.from('workflow_runs').select('*');
            if (schoolId) query = query.eq('school_id', schoolId);

            const { data: runs, error } = await query;
            if (error) throw error;

            const counts = {
                running: 0,
                completed: 0,
                failed: 0,
                waiting: 0,
                escalated: 0,
                cancelled: 0
            };

            let totalCompletionMs = 0;
            let completedCount = 0;

            for (const r of runs || []) {
                counts[r.status as keyof typeof counts] = (counts[r.status as keyof typeof counts] || 0) + 1;
                
                if (r.status === 'completed') {
                    const start = new Date(r.created_at).getTime();
                    const end = new Date(r.updated_at).getTime();
                    totalCompletionMs += (end - start);
                    completedCount++;
                }
            }

            const averageHours = completedCount > 0 
                ? Number((totalCompletionMs / (1000 * 60 * 60 * completedCount)).toFixed(1))
                : 0;

            res.json({
                counts,
                averageCompletionHours: averageHours,
                slaCompliancePercent: runs && runs.length > 0
                    ? Math.round(((runs.length - counts.escalated) / runs.length) * 100)
                    : 100
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
