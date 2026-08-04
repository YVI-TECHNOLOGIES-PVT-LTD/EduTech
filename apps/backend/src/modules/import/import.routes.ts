import { Router } from 'express';
import multer from 'multer';
import { ImportController } from './import.controller';
import { authenticate } from '../../auth/auth.middleware';

export const importRouter = Router();

// Multer Config
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middleware to ensure role-based access control per entity
const checkImportAccess = (req: any, res: any, next: any) => {
    try {
        const user = req.context?.user;
        const roles = user?.roles || [];
        const schoolId = user?.school_id;

        if (!user || roles.length === 0) {
            console.error("[Import Access] User or roles missing in context");
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!schoolId) {
            console.error("[Import Access] school_id not found for user:", user.email);
            return res.status(403).json({ error: "Access Denied: School not resolved" });
        }

        // 1. Super-Admin (Standard ADMIN) can do everything
        if (roles.includes('ADMIN')) return next();

        // 2. Granular checks for specialized roles
        const { entityType } = req.body; // Present in POST /upload and POST /execute

        // If it's a history/download request (GET), we allow these roles to view their context
        if (req.method === 'GET') {
            if (roles.includes('TRANSPORT_ADMIN') || roles.includes('HEAD_OF_INSTITUTE')) {
                return next();
            }
        }

        // 3. POST checks
        if (roles.includes('TRANSPORT_ADMIN')) {
            const allowed = ['VEHICLE', 'DRIVER', 'DRIVER_VEHICLE_MAP'];
            if (allowed.includes(entityType)) return next();

            console.warn(`[Import Access] TRANSPORT_ADMIN ${user.email} attempted to import ${entityType}`);
            return res.status(403).json({ error: "Forbidden: Transport Admins can only import vehicles and drivers" });
        }

        if (roles.includes('HEAD_OF_INSTITUTE')) {
            const allowed = ['FACULTY'];
            if (allowed.includes(entityType)) return next();

            console.warn(`[Import Access] HEAD_OF_INSTITUTE ${user.email} attempted to import ${entityType}`);
            return res.status(403).json({ error: "Forbidden: Head of Institute can only import faculty" });
        }

        return res.status(403).json({ error: "Access Denied: Insufficient permissions for this import" });
    } catch (err) {
        console.error("[Import Access Middleware Error]:", err);
        return res.status(500).json({ error: "Internal Auth Error" });
    }
};

importRouter.post('/upload',
    authenticate,
    upload.single('file'), // Run multer first to populate req.body
    checkImportAccess,
    ImportController.validate
);

importRouter.post('/execute',
    authenticate,
    checkImportAccess,
    ImportController.execute
);

importRouter.get('/history',
    authenticate,
    checkImportAccess,
    ImportController.getJobs
);

importRouter.get('/history/:jobId/failed-rows',
    authenticate,
    checkImportAccess,
    ImportController.downloadFailedRows
);
