"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionError = void 0;
const AdmissionError_1 = require("./AdmissionError");
class PermissionError extends AdmissionError_1.AdmissionError {
    constructor(message = 'Access denied') {
        super(message, 403);
    }
}
exports.PermissionError = PermissionError;
