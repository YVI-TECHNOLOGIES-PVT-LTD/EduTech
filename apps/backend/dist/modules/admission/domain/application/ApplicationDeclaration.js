"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationDeclaration = void 0;
class ApplicationDeclaration {
    constructor(id, applicationId, agreedToTerms, parentSignature, dateSigned, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.agreedToTerms = agreedToTerms;
        this.parentSignature = parentSignature;
        this.dateSigned = dateSigned;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    sign(signature) {
        this.agreedToTerms = true;
        this.parentSignature = signature;
        this.dateSigned = new Date();
        this.updatedAt = new Date();
    }
}
exports.ApplicationDeclaration = ApplicationDeclaration;
