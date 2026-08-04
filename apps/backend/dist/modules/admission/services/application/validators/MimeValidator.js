"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimeValidator = void 0;
const ValidationError_1 = require("../../../errors/ValidationError");
class MimeValidator {
    validate(mimeType, allowedMimes) {
        if (!allowedMimes.includes(mimeType)) {
            throw new ValidationError_1.ValidationError(`Unsupported MIME Type: "${mimeType}". Allowed types: ${allowedMimes.join(', ')}`);
        }
    }
}
exports.MimeValidator = MimeValidator;
