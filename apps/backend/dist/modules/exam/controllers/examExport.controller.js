"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamExportController = void 0;
const examExport_service_1 = require("../services/examExport.service");
exports.ExamExportController = {
    /**
     * Export Results to CSV (Compliance Format)
     */
    async exportResults(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "examId required" });
            const data = await examExport_service_1.ExamExportService.getComplianceExportData(examId);
            // If empty, just return 204 or empty json
            if (data.length === 0)
                return res.status(204).send();
            // CSV injection sanitization
            const sanitize = (val) => {
                const str = String(val || '');
                if (['=', '+', '-', '@'].some(char => str.startsWith(char))) {
                    return `'${str}`;
                }
                return str;
            };
            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${sanitize(row[h])}"`).join(','))
            ];
            const csvString = csvRows.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=exam_results_${examId}.csv`);
            res.status(200).send(csvString);
        }
        catch (err) {
            console.error("Export Results Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Export Performance / Conduct Report
     */
    async exportConductReport(req, res) {
        try {
            const { examId } = req.query;
            if (!examId)
                return res.status(400).json({ error: "examId required" });
            const data = await examExport_service_1.ExamExportService.getConductExportData(examId);
            if (data.length === 0)
                return res.status(204).send();
            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
            ];
            const csvString = csvRows.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=exam_conduct_${examId}.csv`);
            res.send(csvString);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Export Audit Trail
     */
    async exportAuditTrail(req, res) {
        try {
            const { examId } = req.query;
            const data = await examExport_service_1.ExamExportService.getAuditExportData(examId);
            if (data.length === 0)
                return res.status(204).send();
            const headers = Object.keys(data[0]);
            const csvRows = [
                headers.join(','),
                ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
            ];
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=exam_audit_${examId}.csv`);
            res.send(csvRows.join('\n'));
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
