"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSizeValidator = void 0;
const ValidationError_1 = require("../../../errors/ValidationError");
class FileSizeValidator {
    validate(fileSize, maxBytes) {
        if (fileSize > maxBytes) {
            const mbLimit = (maxBytes / (1024 * 1024)).toFixed(1);
            const mbUploaded = (fileSize / (1024 * 1024)).toFixed(2);
            throw new ValidationError_1.ValidationError(`File size exceeds limit. Allowed maximum: ${mbLimit}MB. Uploaded: ${mbUploaded}MB.`);
        }
    }
}
exports.FileSizeValidator = FileSizeValidator;
