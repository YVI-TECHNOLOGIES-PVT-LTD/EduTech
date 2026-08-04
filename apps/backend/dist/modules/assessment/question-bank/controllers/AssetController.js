"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetController = void 0;
const QuestionAssetService_1 = require("../services/QuestionAssetService");
class AssetController {
    static async uploadAsset(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            if (!req.body.file_name || !req.body.file_path) {
                return res.status(400).json({ error: 'Missing attachment params.' });
            }
            const asset = await AssetController.assetService.uploadAsset(schoolId, userId, req.body);
            return res.status(201).json(asset);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to upload asset.' });
        }
    }
    static async linkAsset(req, res) {
        try {
            const { questionId, assetId } = req.body;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId || !questionId || !assetId) {
                return res.status(400).json({ error: 'Missing linking credentials or target asset IDs.' });
            }
            await AssetController.assetService.linkAsset(questionId, assetId, schoolId, userId);
            return res.status(200).json({ message: 'Asset linked successfully.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to link asset.' });
        }
    }
    static async unlinkAsset(req, res) {
        try {
            const { questionId, assetId } = req.body;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId || !questionId || !assetId) {
                return res.status(400).json({ error: 'Missing linking credentials or target asset IDs.' });
            }
            await AssetController.assetService.unlinkAsset(questionId, assetId, schoolId, userId);
            return res.status(200).json({ message: 'Asset unlinked successfully.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to unlink asset.' });
        }
    }
    static async getQuestionAssets(req, res) {
        try {
            const { id } = req.params; // Question ID
            const assets = await AssetController.assetService.getQuestionAssets(id);
            return res.status(200).json(assets);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to get assets.' });
        }
    }
    static async deleteAsset(req, res) {
        try {
            const { id } = req.params; // Asset ID
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            await AssetController.assetService.deleteAsset(id, schoolId, userId);
            return res.status(200).json({ message: 'Asset successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete asset.' });
        }
    }
}
exports.AssetController = AssetController;
AssetController.assetService = new QuestionAssetService_1.QuestionAssetService();
exports.default = AssetController;
