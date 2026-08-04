"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrectionValidator = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class CorrectionValidator {
    validatePending(correction) {
        if (correction.status !== 'PENDING') {
            throw new BusinessRuleError_1.BusinessRuleError(`Correction status is "${correction.status}". Only PENDING requests can be processed.`);
        }
    }
}
exports.CorrectionValidator = CorrectionValidator;
