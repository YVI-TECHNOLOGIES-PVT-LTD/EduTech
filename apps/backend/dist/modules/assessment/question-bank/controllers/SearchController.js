"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const QuestionSearchService_1 = require("../services/QuestionSearchService");
class SearchController {
    static async searchQuestions(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            // Normalize numeric queries
            const queryParams = {
                ...req.query,
                page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
                limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 10
            };
            const result = await SearchController.searchService.search(schoolId, queryParams);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to perform search' });
        }
    }
}
exports.SearchController = SearchController;
SearchController.searchService = new QuestionSearchService_1.QuestionSearchService();
exports.default = SearchController;
