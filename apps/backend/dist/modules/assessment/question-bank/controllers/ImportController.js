"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportController = void 0;
const import_export_service_1 = require("../services/import-export.service");
const QuestionValidator_1 = require("../validators/QuestionValidator");
class ImportController {
    static async importCsv(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            // Validate inputs
            const validated = QuestionValidator_1.QuestionValidator.validateImport(req.body);
            const result = await ImportController.importService.importQuestionsFromCsv(schoolId, userId, validated.academicYearId, validated.subjectId, validated.folderId || null, validated.csv);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to import CSV dataset.' });
        }
    }
}
exports.ImportController = ImportController;
ImportController.importService = new import_export_service_1.ImportExportService();
exports.default = ImportController;
