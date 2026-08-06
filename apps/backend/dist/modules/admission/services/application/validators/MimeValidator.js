"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimeValidator = void 0;
const ValidationError_1 = require("../../../errors/ValidationError");
class MimeValidator {
    validate(mimeType, allowedMimes, fileBuffer) {
        if (!allowedMimes.includes(mimeType)) {
            throw new ValidationError_1.ValidationError(`Unsupported MIME Type: "${mimeType}". Allowed types: ${allowedMimes.join(', ')}`);
        }
        if (fileBuffer && fileBuffer.length >= 4) {
            const isPdf = fileBuffer.slice(0, 4).toString('utf-8') === '%PDF';
            const isPng = fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4E && fileBuffer[3] === 0x47;
            const isJpeg = fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8 && fileBuffer[2] === 0xFF;
            if (mimeType === 'application/pdf' && !isPdf) {
                throw new ValidationError_1.ValidationError('File signature mismatch: File binary content magic bytes do not match valid PDF header (%PDF).');
            }
            if (mimeType === 'image/png' && !isPng) {
                throw new ValidationError_1.ValidationError('File signature mismatch: File binary content magic bytes do not match valid PNG header.');
            }
            if ((mimeType === 'image/jpeg' || mimeType === 'image/jpg') && !isJpeg) {
                throw new ValidationError_1.ValidationError('File signature mismatch: File binary content magic bytes do not match valid JPEG header.');
            }
        }
    }
}
exports.MimeValidator = MimeValidator;
