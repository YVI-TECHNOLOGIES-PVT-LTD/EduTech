import multer from 'multer';
import { Request } from 'express';
import { ApplicationValidationError } from '../modules/admission-management/errors/admission.errors';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mimeType = (file.mimetype || '').toLowerCase();
  const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || '';

  if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new ApplicationValidationError(
        `Invalid file type '${file.mimetype}'. Only PDF, JPEG, PNG, and WEBP files up to 10MB are permitted.`,
      ) as any,
    );
  }

  cb(null, true);
};

export const uploadSingleMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB Limit
  },
  fileFilter,
}).single('file');

export const uploadMultipleMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB Limit per file
    files: 5,
  },
  fileFilter,
}).array('files', 5);
