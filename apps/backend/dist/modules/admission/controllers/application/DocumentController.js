"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentController = void 0;
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("../crm/ControllerErrorHandler");
const rbac_middleware_1 = require("../../../../rbac/rbac.middleware");
class DocumentController {
    constructor(docService, uploadService, downloadService, verificationService, checklistService, versionService, flagService, appService) {
        this.docService = docService;
        this.uploadService = uploadService;
        this.downloadService = downloadService;
        this.verificationService = verificationService;
        this.checklistService = checklistService;
        this.versionService = versionService;
        this.flagService = flagService;
        this.appService = appService;
        this.upload = async (req, res) => {
            try {
                await this.checkFlags(req);
                // Check flag for upload
                const schoolId = req.context?.user?.school_id || null;
                const envMode = process.env.NODE_ENV || 'development';
                if (!await this.flagService.isEnabled('admission', 'document_upload', envMode, schoolId)) {
                    throw new PermissionError_1.PermissionError('Feature Disabled: document_upload');
                }
                const { application_id, document_type_code } = req.body;
                const file = req.file;
                if (!file) {
                    return res.status(400).json({ error: 'No file attachment found' });
                }
                await this.enforceApplicationAccess(req, application_id);
                const uploadedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const metadata = {
                    device: req.headers['user-agent'] || 'Unknown',
                    browser: req.headers['user-agent'] || 'Unknown',
                    ipAddress: req.ip || '127.0.0.1',
                    uploadedFrom: 'API'
                };
                const data = await this.uploadService.uploadDocument(application_id, document_type_code, file.buffer, file.originalname, file.mimetype, uploadedBy, metadata, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getById = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceDocumentAccess(req, id);
                const data = await this.docService.getDocumentById(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.delete = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceDocumentAccess(req, id);
                await this.docService.deleteDocument(id);
                res.json({ success: true, message: 'Document deleted successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.verify = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id || null;
                const envMode = process.env.NODE_ENV || 'development';
                if (!await this.flagService.isEnabled('admission', 'document_verification', envMode, schoolId)) {
                    throw new PermissionError_1.PermissionError('Feature Disabled: document_verification');
                }
                const { id } = req.params;
                const { remarks } = req.body;
                const reviewerId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'counselor';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.verificationService.verify(id, reviewerId, remarks, role, correlationId);
                res.json({ success: true, document: data, message: 'Document marked verified successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.reject = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id || null;
                const envMode = process.env.NODE_ENV || 'development';
                if (!await this.flagService.isEnabled('admission', 'document_verification', envMode, schoolId)) {
                    throw new PermissionError_1.PermissionError('Feature Disabled: document_verification');
                }
                const { id } = req.params;
                const { remarks } = req.body;
                const reviewerId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'counselor';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.verificationService.reject(id, reviewerId, remarks, role, correlationId);
                res.json({ success: true, document: data, message: 'Document rejected successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.requestCorrection = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id || null;
                const envMode = process.env.NODE_ENV || 'development';
                if (!await this.flagService.isEnabled('admission', 'document_verification', envMode, schoolId)) {
                    throw new PermissionError_1.PermissionError('Feature Disabled: document_verification');
                }
                const { id } = req.params;
                const { remarks } = req.body;
                const reviewerId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'counselor';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.verificationService.requestCorrection(id, reviewerId, remarks, role, correlationId);
                res.json({ success: true, document: data, message: 'Correction requested successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getSignedUrl = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id || null;
                const envMode = process.env.NODE_ENV || 'development';
                if (!await this.flagService.isEnabled('admission', 'document_download', envMode, schoolId)) {
                    throw new PermissionError_1.PermissionError('Feature Disabled: document_download');
                }
                const { id } = req.params;
                const requestedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                await this.enforceDocumentAccess(req, id);
                const signedUrl = await this.downloadService.getSignedDownloadUrl(id, requestedBy, 3600, correlationId);
                res.json({ success: true, download_url: signedUrl });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getChecklist = async (req, res) => {
            try {
                await this.checkFlags(req);
                const schoolId = req.context?.user?.school_id || null;
                const envMode = process.env.NODE_ENV || 'development';
                if (!await this.flagService.isEnabled('admission', 'document_checklist', envMode, schoolId)) {
                    throw new PermissionError_1.PermissionError('Feature Disabled: document_checklist');
                }
                const { grade } = req.params;
                const academicYearId = req.headers['x-academic-year-id'];
                if (!schoolId || !academicYearId) {
                    throw new Error('School and Academic Year contexts are required');
                }
                const data = await this.checklistService.getChecklist(schoolId, academicYearId, grade);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.listByApplication = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { applicationId } = req.params;
                await this.enforceApplicationAccess(req, applicationId);
                const data = await this.docService.getDocumentsByApplicationId(applicationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getVersions = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceDocumentAccess(req, id);
                const data = await this.versionService.getVersions(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.restoreVersion = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { id } = req.params;
                await this.enforceDocumentAccess(req, id);
                const { version } = req.body;
                const restoredBy = req.context?.user?.id || null;
                const data = await this.versionService.restoreVersion(id, Number(version), restoredBy);
                res.json({ success: true, version: data });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.bulkVerify = async (req, res) => {
            try {
                await this.checkFlags(req);
                const { document_ids, remarks } = req.body;
                const reviewerId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'admission_officer';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.verificationService.bulkVerify(document_ids ?? [], reviewerId, role, remarks ?? null, correlationId);
                res.json({ success: true, documents: data });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.bulkUpload = async (req, res) => {
            try {
                await this.checkFlags(req);
                const applicationId = req.body.application_id;
                const files = req.files;
                const codes = req.body.document_type_codes?.split(',') ?? [];
                if (!applicationId || !files?.length) {
                    return res.status(400).json({ error: 'application_id and files required' });
                }
                await this.enforceApplicationAccess(req, applicationId);
                const uploadedBy = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const uploads = files.map((file, idx) => ({
                    docTypeCode: codes[idx] ?? codes[0] ?? 'birth_certificate',
                    fileBuffer: file.buffer,
                    originalFilename: file.originalname,
                    mimeType: file.mimetype,
                }));
                const data = await this.uploadService.bulkUpload(applicationId, uploads, uploadedBy, { uploadedFrom: 'API_BULK' }, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
    async checkFlags(req) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        const isCrmActive = await this.flagService.isEnabled('admission', 'admission_crm', envMode, schoolId);
        const isDocActive = await this.flagService.isEnabled('admission', 'application_documents', envMode, schoolId);
        if (!isCrmActive || !isDocActive) {
            throw new PermissionError_1.PermissionError('Feature Disabled: application_documents');
        }
    }
    async enforceApplicationAccess(req, applicationId) {
        const user = req.context?.user;
        if (!user) {
            throw new PermissionError_1.PermissionError('Unauthorized');
        }
        const roles = (0, rbac_middleware_1.getEffectiveRoles)(user.roles);
        if (roles.includes('ADMIN') || roles.includes('ADMISSION_OFFICER') || roles.includes('COUNSELOR')) {
            return;
        }
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
            return;
        }
        if (!user.permissions?.includes('admission.application.view') && !user.permissions?.includes('admission.review')) {
            throw new PermissionError_1.PermissionError('Forbidden: Insufficient Permissions');
        }
    }
    async enforceDocumentAccess(req, documentId) {
        const doc = await this.docService.getDocumentById(documentId);
        await this.enforceApplicationAccess(req, doc.applicationId);
        return doc.applicationId;
    }
}
exports.DocumentController = DocumentController;
