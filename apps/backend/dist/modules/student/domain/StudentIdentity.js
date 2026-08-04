"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentIdentity = void 0;
class StudentIdentity {
    constructor(id, studentId, barcode, qrCode, printed, issuedDate, createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.barcode = barcode;
        this.qrCode = qrCode;
        this.printed = printed;
        this.issuedDate = issuedDate;
        this.createdAt = createdAt;
    }
    markAsPrinted() {
        this.printed = true;
        this.issuedDate = new Date();
    }
}
exports.StudentIdentity = StudentIdentity;
