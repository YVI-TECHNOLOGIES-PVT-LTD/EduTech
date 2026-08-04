"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryService = void 0;
const BaseService_1 = require("../BaseService");
const AdmissionEnquiry_1 = require("../../domain/AdmissionEnquiry");
const create_enquiry_dto_1 = require("../../dto/create-enquiry.dto");
const update_enquiry_dto_1 = require("../../dto/update-enquiry.dto");
const ConflictError_1 = require("../../errors/ConflictError");
const NotFoundError_1 = require("../../errors/NotFoundError");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
const ValidationError_1 = require("../../errors/ValidationError");
const CrmRecordMapper_1 = require("./CrmRecordMapper");
class EnquiryService extends BaseService_1.BaseService {
    constructor(enquiryRepo, transactionService, auditService, leadRepo, appRepo, applicationService) {
        super();
        this.enquiryRepo = enquiryRepo;
        this.transactionService = transactionService;
        this.auditService = auditService;
        this.leadRepo = leadRepo;
        this.appRepo = appRepo;
        this.applicationService = applicationService;
    }
    async createEnquiry(schoolId, academicYearId, payload, correlationId) {
        const validated = this.validate(create_enquiry_dto_1.createEnquirySchema, payload);
        // Check for duplicates
        const dupCheck = await this.checkDuplicates({
            ...validated,
            academic_year_id: academicYearId
        });
        if (dupCheck.status === 'exact_match' && !payload.ignore_duplicate) {
            throw new ConflictError_1.ConflictError('Exact duplicate enquiry found', { matches: dupCheck.matches });
        }
        const id = crypto.randomUUID();
        const enquiry = new AdmissionEnquiry_1.AdmissionEnquiry(id, schoolId, academicYearId, validated.student_name, validated.grade_applied_for, validated.parent_name, validated.parent_email, validated.parent_phone, validated.source, 'new', new Date(), new Date(), null, validated.date_of_birth ? new Date(validated.date_of_birth) : null, validated.gender || null, validated.current_school || null, validated.address || null, validated.remarks || null);
        const saved = await this.enquiryRepo.save(enquiry);
        await this.auditService.logAudit({
            userId: null,
            action: 'INSERT',
            entityName: 'admission_enquiries',
            entityId: saved.id,
            afterState: saved,
            correlationId
        });
        return saved;
    }
    async updateEnquiry(id, payload, correlationId) {
        const validated = this.validate(update_enquiry_dto_1.updateEnquirySchema, payload);
        const existing = await this.enquiryRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Enquiry with ID ${id} not found`);
        }
        const beforeState = { ...existing };
        // Map values
        const updated = new AdmissionEnquiry_1.AdmissionEnquiry(existing.id, existing.schoolId, existing.academicYearId, validated.student_name !== undefined ? validated.student_name : existing.studentName, validated.grade_applied_for !== undefined ? validated.grade_applied_for : existing.gradeAppliedFor, validated.parent_name !== undefined ? validated.parent_name : existing.parentName, validated.parent_email !== undefined ? validated.parent_email : existing.parentEmail, validated.parent_phone !== undefined ? validated.parent_phone : existing.parentPhone, validated.source !== undefined ? validated.source : existing.source, existing.status, existing.createdAt, new Date(), existing.deletedAt, validated.date_of_birth !== undefined ? (validated.date_of_birth ? new Date(validated.date_of_birth) : null) : existing.dateOfBirth, validated.gender !== undefined ? validated.gender : existing.gender, validated.current_school !== undefined ? validated.current_school : existing.currentSchool, validated.address !== undefined ? validated.address : existing.address, validated.remarks !== undefined ? validated.remarks : existing.remarks);
        const saved = await this.enquiryRepo.save(updated);
        await this.auditService.logAudit({
            userId: null,
            action: 'UPDATE',
            entityName: 'admission_enquiries',
            entityId: saved.id,
            beforeState,
            afterState: saved,
            correlationId
        });
        return saved;
    }
    async getEnquiryById(id) {
        const enquiry = await this.enquiryRepo.findById(id);
        if (!enquiry) {
            throw new NotFoundError_1.NotFoundError(`Enquiry with ID ${id} not found`);
        }
        const lead = await this.leadRepo.findByEnquiryId(id);
        const applicationId = lead ? (await this.appRepo.findCurrentByLeadId(lead.id))?.id ?? null : null;
        const counselorName = lead?.counselorId
            ? (await (0, CrmRecordMapper_1.resolveCounselorNames)([lead.counselorId])).get(lead.counselorId) ?? null
            : null;
        const assignmentMap = lead ? await (0, CrmRecordMapper_1.resolveAssignmentHistory)([lead.id]) : new Map();
        return (0, CrmRecordMapper_1.mapEnquiryToApiRecord)(enquiry, lead, applicationId, counselorName, lead ? assignmentMap.get(lead.id) : undefined);
    }
    async deleteEnquiry(id, correlationId) {
        const existing = await this.enquiryRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Enquiry with ID ${id} not found`);
        }
        await this.enquiryRepo.softDelete(id);
        await this.auditService.logAudit({
            userId: null,
            action: 'DELETE',
            entityName: 'admission_enquiries',
            entityId: id,
            beforeState: existing,
            correlationId
        });
    }
    async listEnquiries(schoolId, page, limit, filters, search, sortColumn, sortOrder) {
        const { data: enquiries, total } = await this.enquiryRepo.findAll(schoolId, page, limit, filters, search, sortColumn, sortOrder);
        const enquiryIds = enquiries.map(e => e.id);
        const leadMap = await this.leadRepo.findByEnquiryIds(enquiryIds);
        const applicationMap = await this.appRepo.findCurrentIdsByLeadIds([...leadMap.values()].map(l => l.id));
        const counselorNames = await (0, CrmRecordMapper_1.resolveCounselorNames)([...leadMap.values()].map(l => l.counselorId).filter(Boolean));
        const assignmentMap = await (0, CrmRecordMapper_1.resolveAssignmentHistory)([...leadMap.values()].map(l => l.id));
        const data = await Promise.all(enquiries.map(enquiry => {
            const lead = leadMap.get(enquiry.id) ?? null;
            const applicationId = lead ? applicationMap.get(lead.id) ?? null : null;
            const counselorName = lead?.counselorId ? counselorNames.get(lead.counselorId) ?? null : null;
            return (0, CrmRecordMapper_1.mapEnquiryToApiRecord)(enquiry, lead, applicationId, counselorName, lead ? assignmentMap.get(lead.id) : undefined);
        }));
        return { data, total };
    }
    async convertToLead(enquiryId, correlationId, userId) {
        const enquiry = await this.enquiryRepo.findById(enquiryId);
        if (!enquiry) {
            throw new NotFoundError_1.NotFoundError(`Enquiry with ID ${enquiryId} not found`);
        }
        if (enquiry.status === 'converted') {
            throw new ConflictError_1.ConflictError('Enquiry is already converted to a lead');
        }
        // Step 1: Look up an existing lead for this enquiry (created during assignment)
        let existingLead = await this.leadRepo.findByEnquiryId(enquiryId);
        // Step 2: Resolve counselorId — prefer lead.counselorId over remarks fallback
        let counselorId = existingLead?.counselorId ?? null;
        if (!counselorId) {
            // Fallback: check remarks for legacy compatibility
            let remarksObj = {};
            if (enquiry.remarks) {
                try {
                    remarksObj = JSON.parse(enquiry.remarks);
                }
                catch (e) {
                    // Ignore parse errors for non-JSON remarks
                }
            }
            counselorId = remarksObj.counselor_id || null;
        }
        if (!counselorId) {
            throw new BusinessRuleError_1.BusinessRuleError('Inquiry must be assigned a counselor before conversion');
        }
        let leadId;
        if (existingLead) {
            // Lead already exists (created during assignment) — only mark enquiry as converted
            leadId = existingLead.id;
            const { error } = await (await Promise.resolve().then(() => __importStar(require('../../../../config/supabase')))).supabase
                .from('admission_enquiries')
                .update({ status: 'converted', updated_at: new Date().toISOString() })
                .eq('id', enquiryId);
            if (error) {
                this.logError('Failed to mark enquiry as converted', error, correlationId);
                throw new Error(`Failed to update enquiry status: ${error.message}`);
            }
        }
        else {
            // No lead yet — create it atomically via transaction
            leadId = crypto.randomUUID();
            await this.transactionService.convertEnquiryToLead(enquiryId, leadId, correlationId, counselorId);
        }
        await this.auditService.logAudit({
            userId: userId || null,
            action: 'CONVERT_ENQUIRY',
            entityName: 'admission_enquiries',
            entityId: enquiryId,
            afterState: { leadId, counselorId },
            correlationId
        });
        return leadId;
    }
    /**
     * Converts an enquiry to a lead and creates exactly one CRM application.
     * Idempotent: returns existing application if already created for the lead.
     */
    async convertToApplication(enquiryId, correlationId, userId) {
        const enquiry = await this.enquiryRepo.findById(enquiryId);
        if (!enquiry) {
            throw new NotFoundError_1.NotFoundError(`Enquiry with ID ${enquiryId} not found`);
        }
        let leadId;
        if (enquiry.status === 'converted') {
            const existingLead = await this.leadRepo.findByEnquiryId(enquiryId);
            if (!existingLead) {
                throw new BusinessRuleError_1.BusinessRuleError('Enquiry is converted but no lead record exists');
            }
            leadId = existingLead.id;
        }
        else {
            leadId = await this.convertToLead(enquiryId, correlationId, userId);
        }
        const existingApp = await this.appRepo.findCurrentByLeadId(leadId);
        if (existingApp) {
            return { leadId, applicationId: existingApp.id };
        }
        if (!enquiry.dateOfBirth) {
            throw new ValidationError_1.ValidationError('Date of birth is required on the inquiry before converting to an application');
        }
        const application = await this.applicationService.createApplication(enquiry.schoolId, enquiry.academicYearId, userId ?? null, {
            lead_id: leadId,
            grade: enquiry.gradeAppliedFor,
            student_name: enquiry.studentName,
            date_of_birth: enquiry.dateOfBirth.toISOString().split('T')[0],
            gender: enquiry.gender || 'Other',
        }, correlationId);
        await this.auditService.logStatusChange({
            entityName: 'admission_leads',
            entityId: leadId,
            oldStatus: null,
            newStatus: 'INTERESTED',
            changedBy: userId ?? null,
            reason: 'Lead converted to application',
            correlationId,
            eventName: 'LeadConverted'
        });
        return { leadId, applicationId: application.id };
    }
    async checkDuplicates(enquiryData) {
        const potentialMatches = await this.enquiryRepo.findPossibleDuplicates(enquiryData.student_name, enquiryData.parent_phone, enquiryData.parent_email, enquiryData.date_of_birth ? new Date(enquiryData.date_of_birth) : null, enquiryData.grade_applied_for, enquiryData.academic_year_id);
        if (potentialMatches.length === 0) {
            return { status: 'no_duplicate', matches: [] };
        }
        const matches = potentialMatches.map(m => {
            let matchType = 'potential_match';
            const dobMatches = m.dateOfBirth && enquiryData.date_of_birth &&
                new Date(m.dateOfBirth).toISOString().split('T')[0] === new Date(enquiryData.date_of_birth).toISOString().split('T')[0];
            const emailMatches = m.parentEmail === enquiryData.parent_email;
            const phoneMatches = m.parentPhone === enquiryData.parent_phone;
            const nameMatches = m.studentName.toLowerCase() === enquiryData.student_name.toLowerCase();
            if (nameMatches && phoneMatches && emailMatches && dobMatches) {
                matchType = 'exact_match';
            }
            else if (nameMatches && (phoneMatches || emailMatches)) {
                matchType = 'merge_candidate';
            }
            return { enquiry: m, matchType };
        });
        const hasExact = matches.some(m => m.matchType === 'exact_match');
        const hasMerge = matches.some(m => m.matchType === 'merge_candidate');
        let status = 'potentials_found';
        if (hasExact)
            status = 'exact_match';
        else if (hasMerge)
            status = 'merge_candidate';
        return { status, matches };
    }
}
exports.EnquiryService = EnquiryService;
