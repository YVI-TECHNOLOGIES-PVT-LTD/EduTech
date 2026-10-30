import { Router } from 'express';
import { CommunicationController } from './controllers/communication.controller';

export const communicationRouter = Router();

// ==========================================
// 1. FEEDS & ENGAGEMENT ROUTES
// ==========================================

// Reaction Catalog & User Reactions
communicationRouter.get('/reactions/catalog', CommunicationController.getReactionCatalogue);
communicationRouter.post('/posts/:id/react', CommunicationController.reactToPost);
communicationRouter.delete('/posts/:id/react', CommunicationController.removeReaction);

// Comments
communicationRouter.post('/posts/:id/comments', CommunicationController.addComment);
communicationRouter.get('/posts/:id/comments', CommunicationController.listComments);
communicationRouter.delete('/comments/:commentId', CommunicationController.deleteComment);

// Feed Posts
communicationRouter.post('/posts', CommunicationController.createPost);
communicationRouter.get('/posts', CommunicationController.listPosts);
communicationRouter.get('/posts/:id', CommunicationController.getPostById);
communicationRouter.patch('/posts/:id/publish', CommunicationController.publishPost);
communicationRouter.delete('/posts/:id', CommunicationController.removePost);

// ==========================================
// 2. HELPDESK & ESCALATION ROUTES
// ==========================================

// Helpdesk Categories
communicationRouter.get('/helpdesk/categories', CommunicationController.listCategories);
communicationRouter.post('/helpdesk/categories', CommunicationController.createCategory);

// Helpdesk Tickets
communicationRouter.post('/helpdesk/tickets', CommunicationController.createTicket);
communicationRouter.get('/helpdesk/tickets', CommunicationController.listTickets);
communicationRouter.get('/helpdesk/tickets/:id', CommunicationController.getTicketById);
communicationRouter.patch(
  '/helpdesk/tickets/:id/status',
  CommunicationController.updateTicketStatus,
);
communicationRouter.patch('/helpdesk/tickets/:id/assign', CommunicationController.assignTicket);

// Helpdesk Messages
communicationRouter.post('/helpdesk/tickets/:id/messages', CommunicationController.addMessage);

// Escalation Rules & Sweeps
communicationRouter.get('/helpdesk/escalation/rules', CommunicationController.listEscalationRules);
communicationRouter.post(
  '/helpdesk/escalation/rules',
  CommunicationController.createEscalationRule,
);
communicationRouter.post(
  '/helpdesk/escalation/evaluate',
  CommunicationController.evaluateEscalations,
);

export default communicationRouter;
