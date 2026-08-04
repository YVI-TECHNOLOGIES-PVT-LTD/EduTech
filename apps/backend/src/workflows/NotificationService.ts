import { supabase } from '../config/supabase';

export const NotificationService = {
    async send(userId: string, title: string, body: string, metadata: any = {}) {
        try {
            await supabase.from('notifications').insert({
                user_id: userId,
                title,
                body,
                metadata
            });
        } catch (error) {
            console.error("[WorkflowNotification] Failed to send notification", error);
        }
    }
};
