"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultPublishController = void 0;
const resultPublish_service_1 = require("../services/resultPublish.service");
const examNotification_service_1 = require("../services/examNotification.service");
exports.ResultPublishController = {
    async publishResults(req, res) {
        try {
            const { examId } = req.body;
            const userId = req.context.user.id;
            if (!examId) {
                return res.status(400).json({ error: "examId is required" });
            }
            // Ensure only ADMIN can publish (Double check, although middleware handles this)
            // Middleware checkPermission(PERMISSIONS.EXAM_PUBLISH) should be used in routes if possible,
            // or we use existing overly generic ones + role check. 
            // Task says "Only Admin role allowed".
            if (!req.context.user.roles.includes('ADMIN')) {
                return res.status(403).json({ error: "Only Admins can publish results." });
            }
            const result = await resultPublish_service_1.ResultPublishService.publishExamResults(examId, userId);
            res.json({ message: "Results published successfully", ...result });
            // Hook: Notify
            examNotification_service_1.ExamNotificationService.notifyResultsPublished(examId);
        }
        catch (err) {
            console.error("Publish Results Error:", err);
            res.status(500).json({ error: err.message });
        }
    }
};
