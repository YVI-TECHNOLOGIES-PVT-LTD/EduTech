import multer from 'multer';
import { Request } from 'express';
import { LearningActivityValidationError } from './learning-activities.types';

export const MAX_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024; // 10 MB hard limit (PostgreSQL ck_s32_file_size)
export const MAX_SUBMISSION_FILES_COUNT = 5;

const ALLOWED_MIME_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // Code & Text
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'text/typescript',
  'application/typescript',
  'text/x-python',
  'application/x-python',
  'application/json',
  'application/sql',
  'text/x-sql',
]);

const ALLOWED_EXTENSIONS = new Set([
  // Documents
  'pdf',
  'doc',
  'docx',
  // Images
  'jpg',
  'jpeg',
  'png',
  'webp',
  // Audio
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'weba',
  // Video
  'mp4',
  'webm',
  'mov',
  // Code & Text
  'txt',
  'py',
  'js',
  'ts',
  'java',
  'cpp',
  'c',
  'cs',
  'html',
  'css',
  'json',
  'sql',
  'md',
]);

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const mimeType = (file.mimetype || '').toLowerCase().split(';')[0].trim();
  const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || '';

  if (!ALLOWED_MIME_TYPES.has(mimeType) && !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new LearningActivityValidationError(
        `Invalid file type '${file.mimetype}' (${file.originalname}). Allowed formats: PDF, Images (PNG, JPG, WEBP), Audio (MP3, WAV, M4A, WEBM), Video (MP4, WEBM, MOV up to 10MB), and Source Code files (.py, .js, .ts, .java, .cpp, .html, .css, .json, .sql).`,
      ) as any,
    );
  }

  cb(null, true);
};

export function detectLearningActivityBufferMimeType(buffer: Buffer): string | null {
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
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // WAV: RIFF at 0..3 and WAVE at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return 'audio/wav';
  }

  // MP3: ID3 (0x49 0x44 0x33) or MPEG frame sync (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  ) {
    return 'audio/mpeg';
  }

  // MP4 / M4A / MOV: ftyp box at 4..7 (0x66 0x74 0x79 0x70) or moov (0x6d 0x6f 0x6f 0x76)
  if (
    buffer.length >= 8 &&
    ((buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) ||
      (buffer[4] === 0x6d && buffer[5] === 0x6f && buffer[6] === 0x6f && buffer[7] === 0x76))
  ) {
    // Check if M4A brand
    if (buffer.length >= 12 && buffer[8] === 0x4d && buffer[9] === 0x34 && buffer[10] === 0x41) {
      return 'audio/mp4';
    }
    return 'video/mp4';
  }

  // WebM / Matroska: EBML header 0x1A 0x45 0xDF 0xA3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'video/webm';
  }

  // Plain Text / Source Code / JSON: Check if first 512 bytes are valid readable UTF-8 text
  const checkLen = Math.min(buffer.length, 512);
  let isText = true;
  for (let i = 0; i < checkLen; i++) {
    const byte = buffer[i];
    // Allow tab (9), newline (10), carriage return (13), and printable ASCII/UTF-8 bytes (>= 32)
    if (byte < 9 || (byte > 13 && byte < 32)) {
      isText = false;
      break;
    }
  }
  if (isText) {
    return 'text/plain';
  }

  return null;
}

export function validateLearningActivityFileBufferSignature(file: Express.Multer.File): void {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new LearningActivityValidationError('File content is empty or unreadable.');
  }

  if (file.buffer.length > MAX_SUBMISSION_FILE_BYTES) {
    throw new LearningActivityValidationError(
      `File "${file.originalname}" exceeds maximum permissible size of 10 MB (PostgreSQL storage constraint).`,
    );
  }

  const detected = detectLearningActivityBufferMimeType(file.buffer);
  if (!detected) {
    throw new LearningActivityValidationError(
      `Corrupted or unsupported binary signature for "${file.originalname}". Allowed formats: PDF, Images (PNG, JPG, WEBP), Audio (MP3, WAV, M4A, WEBM), Video (MP4, WEBM up to 10MB), and Source Code files.`,
    );
  }
}

export const learningActivitiesUploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_SUBMISSION_FILE_BYTES, // 10 MB per file
    files: MAX_SUBMISSION_FILES_COUNT, // Up to 5 files
  },
  fileFilter,
}).array('files', MAX_SUBMISSION_FILES_COUNT);
