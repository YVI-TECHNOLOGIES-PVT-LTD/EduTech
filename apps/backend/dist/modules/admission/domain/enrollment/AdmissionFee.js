"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionFeeComponent = exports.AdmissionFeeStructure = void 0;
class AdmissionFeeStructure {
    constructor(id, schoolId, grade, academicYearId, name, active) {
        this.id = id;
        this.schoolId = schoolId;
        this.grade = grade;
        this.academicYearId = academicYearId;
        this.name = name;
        this.active = active;
    }
}
exports.AdmissionFeeStructure = AdmissionFeeStructure;
class AdmissionFeeComponent {
    constructor(id, structureId, componentName, amount, mandatory) {
        this.id = id;
        this.structureId = structureId;
        this.componentName = componentName;
        this.amount = amount;
        this.mandatory = mandatory;
    }
}
exports.AdmissionFeeComponent = AdmissionFeeComponent;
