import { Router } from 'express';
import { admissionRouter } from '../admission/admission.routes';

export const compatibilityRouter = Router();

// Mount legacy prefixes under the compatibility router
compatibilityRouter.use('/admissions', admissionRouter);
