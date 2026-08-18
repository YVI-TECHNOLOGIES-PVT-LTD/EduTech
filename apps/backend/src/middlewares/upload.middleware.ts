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

export function detectBufferMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // PDF: %PDF (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }

  // PNG: 0x89 0x50 0x4E 0x47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // WEBP: RIFF at 0..3 and WEBP at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return 'image/webp';
  }

  return null;
}

export function validateFileBufferSignature(file: Express.Multer.File): void {
  if (!file || !file.buffer) {
    throw new ApplicationValidationError('File content is empty or unreadable.');
  }

  const detectedMime = detectBufferMimeType(file.buffer);
  if (!detectedMime) {
    throw new ApplicationValidationError(
      'Corrupted or unsupported file content signature. Allowed formats: PDF, JPEG, PNG, WEBP.',
    );
  }

  const declaredMime = (file.mimetype || '').toLowerCase();
  const normalizedDeclared = declaredMime === 'image/jpg' ? 'image/jpeg' : declaredMime;

  if (detectedMime !== normalizedDeclared) {
    throw new ApplicationValidationError(
      `File content signature (${detectedMime}) does not match declared MIME type (${file.mimetype}). File rejected.`,
    );
  }
}

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
