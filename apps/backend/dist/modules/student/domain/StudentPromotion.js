"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentPromotion = void 0;
class StudentPromotion {
    constructor(id, studentId, fromAcademicYearId, toAcademicYearId, fromGrade, toGrade, fromSectionId, toSectionId, promotedBy, promotedAt, promotionReason) {
        this.id = id;
        this.studentId = studentId;
        this.fromAcademicYearId = fromAcademicYearId;
        this.toAcademicYearId = toAcademicYearId;
        this.fromGrade = fromGrade;
        this.toGrade = toGrade;
        this.fromSectionId = fromSectionId;
        this.toSectionId = toSectionId;
        this.promotedBy = promotedBy;
        this.promotedAt = promotedAt;
        this.promotionReason = promotionReason;
    }
}
exports.StudentPromotion = StudentPromotion;
