"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentProvision = void 0;
class StudentProvision {
    constructor(id, applicationId, stepName, status, errorMessage, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.stepName = stepName;
        this.status = status;
        this.errorMessage = errorMessage;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    complete() {
        this.status = 'COMPLETED';
        this.errorMessage = null;
        this.updatedAt = new Date();
    }
    fail(errorMsg) {
        this.status = 'FAILED';
        this.errorMessage = errorMsg;
        this.updatedAt = new Date();
    }
}
exports.StudentProvision = StudentProvision;
