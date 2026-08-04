"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionError = void 0;
class AdmissionError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AdmissionError = AdmissionError;
