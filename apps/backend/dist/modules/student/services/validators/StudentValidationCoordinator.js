"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentValidationCoordinator = void 0;
class StudentValidationCoordinator {
    constructor(studentVal, academicVal, capacityVal, promotionVal, transferVal, identityVal) {
        this.studentVal = studentVal;
        this.academicVal = academicVal;
        this.capacityVal = capacityVal;
        this.promotionVal = promotionVal;
        this.transferVal = transferVal;
        this.identityVal = identityVal;
    }
    async validateClassAllocation(studentId, academicYearId, grade, sectionId) {
        await this.studentVal.validate(studentId);
        await this.capacityVal.validate(academicYearId, grade, sectionId);
    }
    async validatePromotion(studentId) {
        await this.studentVal.validate(studentId);
        await this.promotionVal.validate(studentId);
    }
    async validateTransfer(studentId) {
        await this.studentVal.validate(studentId);
        await this.transferVal.validate(studentId);
    }
    async validateIdentityCard(studentId) {
        await this.studentVal.validate(studentId);
        await this.identityVal.validate(studentId);
    }
}
exports.StudentValidationCoordinator = StudentValidationCoordinator;
