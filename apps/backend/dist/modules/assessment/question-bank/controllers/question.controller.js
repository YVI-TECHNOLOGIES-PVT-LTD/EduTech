"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionController = void 0;
const question_service_1 = require("../services/question.service");
class QuestionController {
    // ==========================================
    // FOLDERS CONTROLLERS (Backward Compatibility)
    // ==========================================
    static async listFolders(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const folders = await QuestionController.questionService.listFolders(schoolId);
            return res.status(200).json(folders);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to list folders' });
        }
    }
    static async createFolder(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'School or user context could not be resolved.' });
            const folder = await QuestionController.questionService.createFolder(schoolId, userId, req.body);
            return res.status(201).json(folder);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create folder' });
        }
    }
    static async updateFolder(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            const { id } = req.params;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'School or user context could not be resolved.' });
            const folder = await QuestionController.questionService.updateFolder(id, schoolId, userId, req.body);
            return res.status(200).json(folder);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update folder' });
        }
    }
    static async deleteFolder(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            const { id } = req.params;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'School or user context could not be resolved.' });
            await QuestionController.questionService.deleteFolder(id, schoolId, userId);
            return res.status(200).json({ message: 'Folder successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete folder' });
        }
    }
    // ==========================================
    // QUESTIONS CONTROLLERS
    // ==========================================
    static async listQuestions(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const { folderId, subjectId, difficulty, bloomLevel, status, search, page, limit } = req.query;
            const folderFilter = folderId === 'root' ? null : (folderId ? String(folderId) : undefined);
            const result = await QuestionController.questionService.listQuestions(schoolId, {
                folderId: folderFilter,
                subjectId: subjectId ? String(subjectId) : undefined,
                difficulty: difficulty ? String(difficulty) : undefined,
                bloomLevel: bloomLevel ? String(bloomLevel) : undefined,
                status: status ? String(status) : undefined,
                search: search ? String(search) : undefined,
                page: page ? parseInt(String(page), 10) : 1,
                limit: limit ? parseInt(String(limit), 10) : 10
            });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to list questions' });
        }
    }
    static async getQuestionById(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const { id } = req.params;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const question = await QuestionController.questionService.getQuestionById(id, schoolId);
            return res.status(200).json(question);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch question' });
        }
    }
    static async createQuestion(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'School or user context could not be resolved.' });
            const question = await QuestionController.questionService.createQuestion(schoolId, userId, req.body);
            return res.status(201).json(question);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create question' });
        }
    }
    static async updateQuestion(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            const { id } = req.params;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'School or user context could not be resolved.' });
            const question = await QuestionController.questionService.updateQuestion(id, schoolId, userId, req.body);
            return res.status(200).json(question);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update question' });
        }
    }
    static async deleteQuestion(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            const { id } = req.params;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'School or user context could not be resolved.' });
            await QuestionController.questionService.deleteQuestion(id, schoolId, userId);
            return res.status(200).json({ message: 'Question successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete question' });
        }
    }
}
exports.QuestionController = QuestionController;
QuestionController.questionService = new question_service_1.QuestionService();
exports.default = QuestionController;
