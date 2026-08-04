"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionSoftDeleted = exports.FeatureFlagUpdated = exports.LeadCreated = exports.EnquiryCreated = void 0;
class EnquiryCreated {
    constructor(enquiryId, schoolId, academicYearId, studentName, parentEmail, parentPhone, timestamp = new Date()) {
        this.enquiryId = enquiryId;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.studentName = studentName;
        this.parentEmail = parentEmail;
        this.parentPhone = parentPhone;
        this.timestamp = timestamp;
    }
}
exports.EnquiryCreated = EnquiryCreated;
class LeadCreated {
    constructor(leadId, enquiryId, status, timestamp = new Date()) {
        this.leadId = leadId;
        this.enquiryId = enquiryId;
        this.status = status;
        this.timestamp = timestamp;
    }
}
exports.LeadCreated = LeadCreated;
class FeatureFlagUpdated {
    constructor(featureKey, module, enabled, environment, tenantId, timestamp = new Date()) {
        this.featureKey = featureKey;
        this.module = module;
        this.enabled = enabled;
        this.environment = environment;
        this.tenantId = tenantId;
        this.timestamp = timestamp;
    }
}
exports.FeatureFlagUpdated = FeatureFlagUpdated;
class AdmissionSoftDeleted {
    constructor(admissionId, deletedAt = new Date()) {
        this.admissionId = admissionId;
        this.deletedAt = deletedAt;
    }
}
exports.AdmissionSoftDeleted = AdmissionSoftDeleted;
