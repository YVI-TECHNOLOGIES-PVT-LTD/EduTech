import { Router } from 'express';
import { ChatbotController } from '../controllers/chatbot.controller';
import { resolvePublicTenantMiddleware } from '../../../middlewares/tenant.middleware';
import { authenticateOptional } from '../../../auth/auth.middleware';

export const chatbotRouter = Router();

// Apply optional authentication (supports both anonymous visitors and logged-in parents/staff)
// and strict explicit tenant resolution (session org_id when logged in, explicit org/school ID otherwise)
chatbotRouter.use(authenticateOptional);
chatbotRouter.use(resolvePublicTenantMiddleware);

// Session endpoints
chatbotRouter.post('/session', ChatbotController.createSession);
chatbotRouter.get('/session/:sessionId', ChatbotController.getSession);
chatbotRouter.post('/session/:sessionId/complete', ChatbotController.completeSession);

// Core message turn
chatbotRouter.post('/message', ChatbotController.sendMessage);
