"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const AdmissionError_1 = require("./AdmissionError");
class NotFoundError extends AdmissionError_1.AdmissionError {
    constructor(message) {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
