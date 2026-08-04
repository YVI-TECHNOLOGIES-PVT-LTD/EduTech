"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionValidator = void 0;
const ValidationError_1 = require("../../../errors/ValidationError");
class ExtensionValidator {
    validate(extension, allowedExtensions) {
        const extLower = extension.toLowerCase().replace(/^\./, '');
        const allowedLower = allowedExtensions.map(e => e.toLowerCase().replace(/^\./, ''));
        if (!allowedLower.includes(extLower)) {
            throw new ValidationError_1.ValidationError(`Unsupported File Extension: ".${extLower}". Allowed extensions: ${allowedExtensions.join(', ')}`);
        }
    }
}
exports.ExtensionValidator = ExtensionValidator;
