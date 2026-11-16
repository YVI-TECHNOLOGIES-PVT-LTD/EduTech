import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

export const notificationRouter = Router();

// Retrieve unread count (for bell badge)
notificationRouter.get('/unread-count', NotificationController.getUnreadCount);

// List notifications with pagination & filtering
notificationRouter.get('/', NotificationController.list);

// Mark all as read
notificationRouter.post('/mark-all-read', NotificationController.markAllRead);

// Mark a single notification as read
notificationRouter.patch('/:id/read', NotificationController.markRead);

// Delete / dismiss a notification
notificationRouter.delete('/:id', NotificationController.delete);
