"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const supabase_1 = require("../config/supabase");
const workflow_service_1 = require("./workflow.service");
class WorkflowController {
    static async listWorkflows(req, res) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('workflows')
                .select('*, workflow_versions(*)');
            if (error)
                throw error;
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async createWorkflow(req, res) {
        try {
            const { name, code, description, is_template } = req.body;
            const { data, error } = await supabase_1.supabase
                .from('workflows')
                .insert({ name, code, description, is_template: is_template || false })
                .select()
                .single();
            if (error)
                throw error;
            res.status(201).json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async cloneWorkflow(req, res) {
        try {
            const { id } = req.params;
            const { new_name, new_code } = req.body;
            if (!new_name || !new_code)
                return res.status(400).json({ error: "Missing parameters: new_name and new_code" });
            const cloned = await workflow_service_1.WorkflowService.cloneWorkflow(id, new_name, new_code);
            res.json(cloned);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async getRuns(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            let query = supabase_1.supabase.from('workflow_runs').select('*, workflow_versions(workflows(*))');
            if (schoolId)
                query = query.eq('school_id', schoolId);
            const { data, error } = await query;
            if (error)
                throw error;
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async submitDecision(req, res) {
        try {
            const { runId, nodeId } = req.params;
            const { decision, remarks } = req.body;
            const userId = req.context?.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            if (!decision || !['approved', 'rejected'].includes(decision)) {
                return res.status(400).json({ error: "Decision must be 'approved' or 'rejected'" });
            }
            const outcome = await workflow_service_1.WorkflowService.submitDecision(runId, nodeId, userId, decision, remarks || '');
            res.json(outcome);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async getLogs(req, res) {
        try {
            const { runId } = req.params;
            const { data, error } = await supabase_1.supabase
                .from('workflow_logs')
                .select('*, performed_by:performed_by(full_name)')
                .eq('workflow_run_id', runId)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async getAnalytics(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            let query = supabase_1.supabase.from('workflow_runs').select('*');
            if (schoolId)
                query = query.eq('school_id', schoolId);
            const { data: runs, error } = await query;
            if (error)
                throw error;
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
                counts[r.status] = (counts[r.status] || 0) + 1;
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
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
exports.WorkflowController = WorkflowController;
