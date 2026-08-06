import { Router } from 'express';
import { securityHeadersMiddleware } from '../headers/security.headers';
import { inputSanitizerMiddleware } from '../sanitizer/security.sanitizer';
import { globalRateLimiterMiddleware } from '../rate-limit/rate-limit.engine';

export const securityPipelineRouter = Router();

securityPipelineRouter.use(securityHeadersMiddleware);
securityPipelineRouter.use(inputSanitizerMiddleware);
securityPipelineRouter.use(globalRateLimiterMiddleware());
