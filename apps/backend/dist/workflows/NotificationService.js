"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const supabase_1 = require("../config/supabase");
exports.NotificationService = {
    async send(userId, title, body, metadata = {}) {
        try {
            await supabase_1.supabase.from('notifications').insert({
                user_id: userId,
                title,
                body,
                metadata
            });
        }
        catch (error) {
            console.error("[WorkflowNotification] Failed to send notification", error);
        }
    }
};
