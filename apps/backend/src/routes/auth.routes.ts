import { Router } from 'express';
import { AuthController } from '../auth/controllers/auth.controller';
import { authenticate } from '../auth/auth.middleware';

export const authRouter = Router();
const controller = new AuthController();

authRouter.post('/login', controller.login);
authRouter.post('/refresh', controller.refresh);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', authenticate, controller.me);
