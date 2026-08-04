"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRuleError = void 0;
const AdmissionError_1 = require("./AdmissionError");
class BusinessRuleError extends AdmissionError_1.AdmissionError {
    constructor(message) {
        super(message, 422);
    }
}
exports.BusinessRuleError = BusinessRuleError;
