"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
const AdmissionError_1 = require("./AdmissionError");
class ValidationError extends AdmissionError_1.AdmissionError {
    constructor(message, errors) {
        super(message, 400);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
