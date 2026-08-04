import { Request, Response } from 'express';
import { DocumentService } from '../../services/application/DocumentService';
import { DocumentUploadService } from '../../services/application/DocumentUploadService';
import { DocumentDownloadService } from '../../services/application/DocumentDownloadService';
import { DocumentVerificationService } from '../../services/application/DocumentVerificationService';
import { DocumentChecklistService } from '../../services/application/DocumentChecklistService';
import { DocumentVersionService } from '../../services/application/DocumentVersionService';
import { ApplicationService } from '../../services/application/ApplicationService';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { PermissionError } from '../../errors/PermissionError';
import { handleControllerError } from '../crm/ControllerErrorHandler';
import { getEffectiveRoles } from '../../../../rbac/rbac.middleware';

export class DocumentController {
    constructor(
        private readonly docService: DocumentService,
        private readonly uploadService: DocumentUploadService,
        private readonly downloadService: DocumentDownloadService,
        private readonly verificationService: DocumentVerificationService,
        private readonly checklistService: DocumentChecklistService,
        private readonly versionService: DocumentVersionService,
        private readonly flagService: FeatureFlagService,
        private readonly appService: ApplicationService
    ) {}

    private async checkFlags(req: Request) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const isCrmActive = await this.flagService.isEnabled('admission', 'admission_crm', envMode, schoolId);
        const isDocActive = await this.flagService.isEnabled('admission', 'application_documents', envMode, schoolId);
        if (!isCrmActive || !isDocActive) {
            throw new PermissionError('Feature Disabled: application_documents');
        }
    }

    private async enforceApplicationAccess(req: Request, applicationId: string): Promise<void> {
        const user = req.context?.user;
        if (!user) {
            throw new PermissionError('Unauthorized');
        }
        const roles = getEffectiveRoles(user.roles);
        if (roles.includes('ADMIN') || roles.includes('ADMISSION_OFFICER') || roles.includes('COUNSELOR')) {
            return;
        }
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
            return;
        }
        if (!user.permissions?.includes('admission.application.view') && !user.permissions?.includes('admission.review')) {
            throw new PermissionError('Forbidden: Insufficient Permissions');
        }
    }

    private async enforceDocumentAccess(req: Request, documentId: string): Promise<string> {
        const doc = await this.docService.getDocumentById(documentId);
        await this.enforceApplicationAccess(req, doc.applicationId);
        return doc.applicationId;
    }

    public upload = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            
            // Check flag for upload
            const schoolId = req.context?.user?.school_id || null;
            const envMode = process.env.NODE_ENV || 'development';
            if (!await this.flagService.isEnabled('admission', 'document_upload', envMode, schoolId)) {
                throw new PermissionError('Feature Disabled: document_upload');
            }

            const { application_id, document_type_code } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'No file attachment found' });
            }

            await this.enforceApplicationAccess(req, application_id);

            const uploadedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;
            
            const metadata = {
                device: req.headers['user-agent'] || 'Unknown',
                browser: req.headers['user-agent'] || 'Unknown',
                ipAddress: req.ip || '127.0.0.1',
                uploadedFrom: 'API'
            };

            const data = await this.uploadService.uploadDocument(
                application_id,
                document_type_code,
                file.buffer,
                file.originalname,
                file.mimetype,
                uploadedBy,
                metadata,
                correlationId
            );

            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getById = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceDocumentAccess(req, id);
            const data = await this.docService.getDocumentById(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public delete = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceDocumentAccess(req, id);
            await this.docService.deleteDocument(id);
            res.json({ success: true, message: 'Document deleted successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public verify = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            
            const schoolId = req.context?.user?.school_id || null;
            const envMode = process.env.NODE_ENV || 'development';
            if (!await this.flagService.isEnabled('admission', 'document_verification', envMode, schoolId)) {
                throw new PermissionError('Feature Disabled: document_verification');
            }

            const { id } = req.params;
            const { remarks } = req.body;
            const reviewerId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'counselor';
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.verificationService.verify(id, reviewerId, remarks, role, correlationId);
            res.json({ success: true, document: data, message: 'Document marked verified successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public reject = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            
            const schoolId = req.context?.user?.school_id || null;
            const envMode = process.env.NODE_ENV || 'development';
            if (!await this.flagService.isEnabled('admission', 'document_verification', envMode, schoolId)) {
                throw new PermissionError('Feature Disabled: document_verification');
            }

            const { id } = req.params;
            const { remarks } = req.body;
            const reviewerId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'counselor';
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.verificationService.reject(id, reviewerId, remarks, role, correlationId);
            res.json({ success: true, document: data, message: 'Document rejected successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public requestCorrection = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            
            const schoolId = req.context?.user?.school_id || null;
            const envMode = process.env.NODE_ENV || 'development';
            if (!await this.flagService.isEnabled('admission', 'document_verification', envMode, schoolId)) {
                throw new PermissionError('Feature Disabled: document_verification');
            }

            const { id } = req.params;
            const { remarks } = req.body;
            const reviewerId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'counselor';
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.verificationService.requestCorrection(id, reviewerId, remarks, role, correlationId);
            res.json({ success: true, document: data, message: 'Correction requested successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getSignedUrl = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            
            const schoolId = req.context?.user?.school_id || null;
            const envMode = process.env.NODE_ENV || 'development';
            if (!await this.flagService.isEnabled('admission', 'document_download', envMode, schoolId)) {
                throw new PermissionError('Feature Disabled: document_download');
            }

            const { id } = req.params;
            const requestedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            await this.enforceDocumentAccess(req, id);

            const signedUrl = await this.downloadService.getSignedDownloadUrl(id, requestedBy, 3600, correlationId);
            res.json({ success: true, download_url: signedUrl });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getChecklist = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            
            const schoolId = req.context?.user?.school_id || null;
            const envMode = process.env.NODE_ENV || 'development';
            if (!await this.flagService.isEnabled('admission', 'document_checklist', envMode, schoolId)) {
                throw new PermissionError('Feature Disabled: document_checklist');
            }

            const { grade } = req.params;
            const academicYearId = req.headers['x-academic-year-id'] as string;
            if (!schoolId || !academicYearId) {
                throw new Error('School and Academic Year contexts are required');
            }

            const data = await this.checklistService.getChecklist(schoolId, academicYearId, grade);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public listByApplication = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { applicationId } = req.params;
            await this.enforceApplicationAccess(req, applicationId);
            const data = await this.docService.getDocumentsByApplicationId(applicationId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getVersions = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceDocumentAccess(req, id);
            const data = await this.versionService.getVersions(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public restoreVersion = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { id } = req.params;
            await this.enforceDocumentAccess(req, id);
            const { version } = req.body;
            const restoredBy = req.context?.user?.id || null;
            const data = await this.versionService.restoreVersion(id, Number(version), restoredBy);
            res.json({ success: true, version: data });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public bulkVerify = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const { document_ids, remarks } = req.body;
            const reviewerId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'admission_officer';
            const correlationId = req.headers['x-correlation-id'] as string;
            const data = await this.verificationService.bulkVerify(
                document_ids ?? [],
                reviewerId,
                role,
                remarks ?? null,
                correlationId
            );
            res.json({ success: true, documents: data });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public bulkUpload = async (req: Request, res: Response) => {
        try {
            await this.checkFlags(req);
            const applicationId = req.body.application_id;
            const files = req.files as Express.Multer.File[];
            const codes = (req.body.document_type_codes as string)?.split(',') ?? [];
            if (!applicationId || !files?.length) {
                return res.status(400).json({ error: 'application_id and files required' });
            }
            await this.enforceApplicationAccess(req, applicationId);
            const uploadedBy = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;
            const uploads = files.map((file, idx) => ({
                docTypeCode: codes[idx] ?? codes[0] ?? 'birth_certificate',
                fileBuffer: file.buffer,
                originalFilename: file.originalname,
                mimeType: file.mimetype,
            }));
            const data = await this.uploadService.bulkUpload(
                applicationId,
                uploads,
                uploadedBy,
                { uploadedFrom: 'API_BULK' },
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
