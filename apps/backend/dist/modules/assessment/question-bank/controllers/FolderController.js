"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderController = void 0;
const QuestionFolderService_1 = require("../services/QuestionFolderService");
class FolderController {
    static async listFolders(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const folders = await FolderController.folderService.getFolders(schoolId);
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
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const folder = await FolderController.folderService.createFolder(schoolId, userId, req.body);
            return res.status(201).json(folder);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create folder' });
        }
    }
    static async updateFolder(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const folder = await FolderController.folderService.updateFolder(id, schoolId, userId, req.body);
            return res.status(200).json(folder);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update folder' });
        }
    }
    static async deleteFolder(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            await FolderController.folderService.deleteFolder(id, schoolId, userId);
            return res.status(200).json({ message: 'Folder successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete folder' });
        }
    }
    static async bulkMoveQuestions(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            await FolderController.folderService.bulkMoveQuestions(schoolId, userId, req.body);
            return res.status(200).json({ message: 'Questions successfully moved.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to move questions.' });
        }
    }
    static async bulkCopyQuestions(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            await FolderController.folderService.bulkCopyQuestions(schoolId, userId, req.body);
            return res.status(200).json({ message: 'Questions successfully copied.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to copy questions.' });
        }
    }
    static async getFolderStatistics(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const stats = await FolderController.folderService.getStatistics(schoolId);
            return res.status(200).json(stats);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch statistics.' });
        }
    }
}
exports.FolderController = FolderController;
FolderController.folderService = new QuestionFolderService_1.QuestionFolderService();
exports.default = FolderController;
