import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from './auth.middleware';

export const publicAuthRouter = Router();
export const protectedAuthRouter = Router();

// Public Authentication Endpoints (Unprotected)
publicAuthRouter.post('/login', AuthController.login);
publicAuthRouter.post('/refresh', AuthController.refresh);
publicAuthRouter.post('/register', AuthController.registerParent);
publicAuthRouter.post('/verify-otp', AuthController.verifyOtp);


// Protected Authentication Endpoints
protectedAuthRouter.post('/logout', authenticate, AuthController.logout);
