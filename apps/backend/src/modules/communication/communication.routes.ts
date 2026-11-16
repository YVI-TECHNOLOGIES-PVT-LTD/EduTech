import { Router } from 'express';
import { CommunicationController } from './controllers/communication.controller';

export const communicationRouter = Router();

// ==========================================
// 1. FEEDS & ANNOUNCEMENTS ROUTES (C2)
// ==========================================

// Feeds & Posts CRUD
communicationRouter.post('/feeds', CommunicationController.createPost);
communicationRouter.get('/feeds', CommunicationController.listPosts);
communicationRouter.get('/feeds/:id', CommunicationController.getPostById);
communicationRouter.patch('/feeds/:id', CommunicationController.updateDraft);
communicationRouter.patch('/feeds/:id/publish', CommunicationController.publishPost);
communicationRouter.post('/feeds/:id/publish', CommunicationController.publishPost);
communicationRouter.delete('/feeds/:id', CommunicationController.removePost);
communicationRouter.post('/feeds/:id/remove', CommunicationController.removePost);

// Legacy /posts aliases for backwards compatibility
communicationRouter.post('/posts', CommunicationController.createPost);
communicationRouter.get('/posts', CommunicationController.listPosts);
communicationRouter.get('/posts/:id', CommunicationController.getPostById);
communicationRouter.patch('/posts/:id', CommunicationController.updateDraft);
communicationRouter.patch('/posts/:id/publish', CommunicationController.publishPost);
communicationRouter.post('/posts/:id/publish', CommunicationController.publishPost);
communicationRouter.delete('/posts/:id', CommunicationController.removePost);
communicationRouter.post('/posts/:id/remove', CommunicationController.removePost);

// Comments
communicationRouter.post('/feeds/:id/comments', CommunicationController.addComment);
communicationRouter.get('/feeds/:id/comments', CommunicationController.listComments);
communicationRouter.post('/posts/:id/comments', CommunicationController.addComment);
communicationRouter.get('/posts/:id/comments', CommunicationController.listComments);
communicationRouter.delete('/comments/:commentId', CommunicationController.deleteComment);
communicationRouter.delete('/comments/:id', CommunicationController.deleteComment);

// Reactions
communicationRouter.get('/reactions/catalog', CommunicationController.getReactionCatalogue);
communicationRouter.get('/feeds/:id/reactions', CommunicationController.getReactionCatalogue);
communicationRouter.get(
  '/feeds/:id/reactions/catalog',
  CommunicationController.getReactionCatalogue,
);
communicationRouter.put('/feeds/:id/reaction', CommunicationController.reactToPost);
communicationRouter.delete('/feeds/:id/reaction', CommunicationController.removeReaction);
communicationRouter.post('/feeds/:id/react', CommunicationController.reactToPost);
communicationRouter.put('/feeds/:id/react', CommunicationController.reactToPost);
communicationRouter.delete('/feeds/:id/react', CommunicationController.removeReaction);

communicationRouter.get('/posts/:id/reactions', CommunicationController.getReactionCatalogue);
communicationRouter.get(
  '/posts/:id/reactions/catalog',
  CommunicationController.getReactionCatalogue,
);
communicationRouter.post('/posts/:id/react', CommunicationController.reactToPost);
communicationRouter.put('/posts/:id/react', CommunicationController.reactToPost);
communicationRouter.put('/posts/:id/reaction', CommunicationController.reactToPost);
communicationRouter.delete('/posts/:id/react', CommunicationController.removeReaction);
communicationRouter.delete('/posts/:id/reaction', CommunicationController.removeReaction);

// ==========================================
// 2. HELPDESK & ESCALATION ROUTES
// ==========================================

// Helpdesk Categories & Parent Children
communicationRouter.get('/helpdesk/categories', CommunicationController.listCategories);
communicationRouter.post('/helpdesk/categories', CommunicationController.createCategory);
communicationRouter.get('/helpdesk/children', CommunicationController.getChildrenForParent);
communicationRouter.get('/parent/students', CommunicationController.getChildrenForParent);

// Helpdesk Tickets
communicationRouter.post('/helpdesk/tickets', CommunicationController.createTicket);
communicationRouter.get('/helpdesk/tickets', CommunicationController.listTickets);
communicationRouter.get('/helpdesk/tickets/:id', CommunicationController.getTicketById);
communicationRouter.patch(
  '/helpdesk/tickets/:id/status',
  CommunicationController.updateTicketStatus,
);
communicationRouter.post(
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
