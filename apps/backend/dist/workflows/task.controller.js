"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const supabase_1 = require("../config/supabase");
class TaskController {
    static async listTasks(req, res) {
        try {
            const userId = req.context?.user?.id;
            const userRoles = req.context?.user?.roles || [];
            // Fetch tasks assigned directly or via roles
            let query = supabase_1.supabase.from('tasks').select('*, comments:task_comments(*), attachments:task_attachments(*)');
            if (userId) {
                if (userRoles.length > 0) {
                    const rolesFilter = userRoles.map(r => `assigned_role.eq.${r}`).join(',');
                    query = query.or(`assigned_to.eq.${userId},${rolesFilter}`);
                }
                else {
                    query = query.eq('assigned_to', userId);
                }
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error)
                throw error;
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async createTask(req, res) {
        try {
            const { title, description, assigned_to, assigned_role, priority, due_at, related_entity_type, related_entity_id } = req.body;
            const { data, error } = await supabase_1.supabase
                .from('tasks')
                .insert({
                title,
                description,
                assigned_to,
                assigned_role,
                priority: priority || 'medium',
                due_at,
                related_entity_type,
                related_entity_id
            })
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
    static async completeTask(req, res) {
        try {
            const { id } = req.params;
            const { data, error } = await supabase_1.supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            res.json(data);
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    static async addComment(req, res) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const userId = req.context?.user?.id;
            if (!comment)
                return res.status(400).json({ error: "Comment is required" });
            const { data, error } = await supabase_1.supabase
                .from('task_comments')
                .insert({
                task_id: id,
                user_id: userId,
                comment
            })
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
    static async addAttachment(req, res) {
        try {
            const { id } = req.params;
            const { file_name, file_url } = req.body;
            const userId = req.context?.user?.id;
            if (!file_name || !file_url) {
                return res.status(400).json({ error: "file_name and file_url are required" });
            }
            const { data, error } = await supabase_1.supabase
                .from('task_attachments')
                .insert({
                task_id: id,
                file_name,
                file_url,
                uploaded_by: userId
            })
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
}
exports.TaskController = TaskController;
