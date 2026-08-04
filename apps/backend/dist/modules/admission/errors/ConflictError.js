"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = void 0;
const AdmissionError_1 = require("./AdmissionError");
class ConflictError extends AdmissionError_1.AdmissionError {
    constructor(message, details) {
        super(message, 409);
        this.details = details;
    }
}
exports.ConflictError = ConflictError;
