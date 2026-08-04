"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const import_service_1 = require("./import.service");
class ImportController {
    static async validate(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const { entityType, userMode } = req.body;
            if (!entityType) {
                return res.status(400).json({ error: "entityType is required" });
            }
            const schoolId = req.context.user.school_id;
            const summary = await import_service_1.ImportService.validateFile(req.file.buffer, req.file.mimetype, entityType, schoolId, { userMode: userMode });
            res.json(summary);
        }
        catch (err) {
            res.status(400).json({ error: err.message });
        }
    }
    static async execute(req, res) {
        try {
            // Support userMode at root or inside options object
            const { entityType, rows, userMode, options } = req.body;
            const schoolId = req.context.user.school_id;
            const userId = req.context.user.id;
            const resolvedUserMode = userMode || options?.userMode;
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                return res.status(400).json({ error: "No rows provided for execution" });
            }
            const result = await import_service_1.ImportService.executeImport(entityType, rows, {
                schoolId,
                userId,
                userMode: resolvedUserMode
            });
            res.json(result);
        }
        catch (err) {
            console.error("[Execute Import Error]:", err);
            res.status(500).json({ error: err.message || "Internal Server Error during import execution" });
        }
    }
    static async getJobs(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) {
                return res.status(403).json({ error: "School not resolved" });
            }
            const { data, error } = await (require('../../config/supabase').supabase)
                .from('import_jobs')
                .select('*')
                .eq('school_id', schoolId)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error)
                throw new Error(error.message);
            res.json(data);
        }
        catch (err) {
            console.error("[Get Jobs Error]:", err);
            res.status(500).json({ error: err.message });
        }
    }
    static async downloadFailedRows(req, res) {
        try {
            const { jobId } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) {
                return res.status(403).json({ error: "School not resolved" });
            }
            const { data, error } = await (require('../../config/supabase').supabase)
                .from('import_jobs')
                .select('failed_rows')
                .eq('id', jobId)
                .eq('school_id', schoolId) // Security check
                .single();
            if (error || !data)
                throw new Error("Job not found or access denied");
            const failedRows = data.failed_rows;
            if (!failedRows || !Array.isArray(failedRows) || failedRows.length === 0) {
                return res.status(404).json({ error: "No failed rows found" });
            }
            // Convert JSON to CSV
            const { Parser } = require('json2csv');
            // Flatten errors for CSV readability
            const flatData = failedRows.map((r) => ({
                row_number: r.row,
                error_message: r.errors.map((e) => `${e.column}: ${e.message}`).join(' | '),
                ...r.data
            }));
            const parser = new Parser();
            const csv = parser.parse(flatData);
            res.header('Content-Type', 'text/csv');
            res.attachment(`failed_rows_${jobId}.csv`);
            res.send(csv);
        }
        catch (err) {
            console.error("Download Failed", err);
            res.status(500).json({ error: err.message });
        }
    }
}
exports.ImportController = ImportController;
