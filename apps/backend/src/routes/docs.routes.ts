import { Router } from 'express';
import { SwaggerController } from '../docs/swagger/swagger.engine';

export const docsRouter = Router();
const controller = new SwaggerController();

docsRouter.get('/docs.json', controller.getJsonSpec);
docsRouter.get('/docs', controller.getUi);
