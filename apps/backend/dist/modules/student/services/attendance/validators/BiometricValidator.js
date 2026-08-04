"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricValidator = void 0;
const BusinessRuleError_1 = require("../../../../admission/errors/BusinessRuleError");
class BiometricValidator {
    validateRecord(deviceCode, studentAdmissionNo) {
        if (!deviceCode || !studentAdmissionNo) {
            throw new BusinessRuleError_1.BusinessRuleError('Biometric record is missing scanner identifiers.');
        }
    }
}
exports.BiometricValidator = BiometricValidator;
