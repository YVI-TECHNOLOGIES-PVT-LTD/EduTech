import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { resolveTenantMiddleware } from '../../../middlewares/tenant.middleware';
import { authenticateOptional } from '../../../auth/auth.middleware';

export const chatbotRouter = Router();

// Apply optional authentication (supports both anonymous visitors and logged-in parents/staff)
// and tenant resolution (resolves org_id from JWT, custom domain, host, x-tenant-id, or dev fallback)
chatbotRouter.use(authenticateOptional);
chatbotRouter.use(resolveTenantMiddleware);

// Session endpoints
chatbotRouter.post('/session', ChatbotController.createSession);
chatbotRouter.get('/session/:sessionId', ChatbotController.getSession);
chatbotRouter.post('/session/:sessionId/complete', ChatbotController.completeSession);

// Core message turn
chatbotRouter.post('/message', ChatbotController.sendMessage);
