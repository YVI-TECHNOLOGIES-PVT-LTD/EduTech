"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prismaClient_1 = __importDefault(require("../lib/prismaClient"));
const notification_service_1 = require("../modules/notifications/services/notification.service");
const notification_dto_1 = require("../modules/notifications/dto/notification.dto");
const logger_1 = require("../utils/logger");
exports.NotificationService = {
    async send(userId, title, body, metadata = {}) {
        try {
            const user = await prismaClient_1.default.users.findUnique({
                where: { user_id: userId },
                select: { org_id: true },
            });
            if (!user) {
                logger_1.logger.warn(`[Legacy NotificationService] User ${userId} not found, skipping notification`);
                return;
            }
            await notification_service_1.NotificationService.sendNotification(user.org_id, {
                recipient_user_id: userId,
                category: notification_dto_1.notification_category.SYSTEM,
                type: 'workflow.alert',
                priority: notification_dto_1.notification_priority.NORMAL,
                title,
                message: body,
                metadata,
            });
        }
        catch (error) {
            logger_1.logger.error('[Legacy NotificationService] Failed to send notification:', error);
        }
    },
};
