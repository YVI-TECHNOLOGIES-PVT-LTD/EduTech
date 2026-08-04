import { Router } from 'express';
import { TaskController } from './task.controller';

export const taskRouter = Router();

taskRouter.get('/', TaskController.listTasks);
taskRouter.post('/', TaskController.createTask);
taskRouter.post('/:id/complete', TaskController.completeTask);
taskRouter.post('/:id/comments', TaskController.addComment);
taskRouter.post('/:id/attachments', TaskController.addAttachment);
