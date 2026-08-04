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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounselorAssignmentService = void 0;
const BaseService_1 = require("../BaseService");
const AdmissionLead_1 = require("../../domain/AdmissionLead");
const ManualAssignmentStrategy_1 = require("./assignment/ManualAssignmentStrategy");
const RoundRobinAssignmentStrategy_1 = require("./assignment/RoundRobinAssignmentStrategy");
const ConflictError_1 = require("../../errors/ConflictError");
const NotFoundError_1 = require("../../errors/NotFoundError");
class CounselorAssignmentService extends BaseService_1.BaseService {
    constructor(leadRepo, auditService, enquiryRepo, transactionService) {
        super();
        this.leadRepo = leadRepo;
        this.auditService = auditService;
        this.enquiryRepo = enquiryRepo;
        this.transactionService = transactionService;
    }
    /**
     * Assigns a counselor to a lead using the specified strategy.
     */
    async assignCounselor(leadId, strategyType, strategyParams, correlationId, userId) {
        let lead = await this.leadRepo.findById(leadId);
        if (!lead) {
            // Check if it is an Enquiry ID
            const enquiry = await this.enquiryRepo.findById(leadId);
            if (!enquiry) {
                throw new NotFoundError_1.NotFoundError(`Lead or Enquiry with ID ${leadId} not found`);
            }
            // Automatically convert Enquiry to Lead atomically
            await this.transactionService.convertEnquiryToLead(leadId, leadId, correlationId, strategyParams.counselorId);
            lead = await this.leadRepo.findById(leadId);
            if (!lead) {
                throw new Error(`Failed to retrieve lead after converting enquiry ${leadId}`);
            }
        }
        // Enforce conversion guard (check if lead is converted to active application)
        const { data: existingApp } = await (await Promise.resolve().then(() => __importStar(require('../../../../config/supabase')))).supabase
            .from('admission_applications')
            .select('id')
            .eq('lead_id', lead.id)
            .maybeSingle();
        if (existingApp) {
            throw new ConflictError_1.ConflictError('Converted applications cannot be reassigned.');
        }
        // Enforce assignment constraints
        if (lead.counselorId !== null) {
            if (!strategyParams.reassign) {
                throw new ConflictError_1.ConflictError('Lead already assigned');
            }
        }
        const actualUpdatedAt = new Date(lead.updatedAt);
        // Validate optimistic locking if updatedAt is provided
        if (strategyParams.updatedAt) {
            const expectedUpdatedAt = new Date(strategyParams.updatedAt);
            if (actualUpdatedAt.getTime() !== expectedUpdatedAt.getTime()) {
                throw new ConflictError_1.ConflictError('Concurrent modification detected. Please refresh.');
            }
        }
        // Instantiate Strategy
        let strategy;
        if (strategyType === 'manual') {
            if (!strategyParams.counselorId) {
                throw new Error('Counselor ID must be provided for manual assignment');
            }
            strategy = new ManualAssignmentStrategy_1.ManualAssignmentStrategy(strategyParams.counselorId);
        }
        else {
            strategy = new RoundRobinAssignmentStrategy_1.RoundRobinAssignmentStrategy();
        }
        const counselorId = await strategy.assign(lead);
        const logAssignmentAudit = async (savedLead, prevLead) => {
            const enquiryId = savedLead.enquiryId || prevLead.enquiryId;
            const enquiry = enquiryId ? await this.enquiryRepo.findById(enquiryId) : null;
            const schoolId = enquiry?.schoolId || null;
            const academicYearId = enquiry?.academicYearId || null;
            await this.auditService.logStatusChange({
                entityName: 'admission_leads',
                entityId: savedLead.id,
                oldStatus: prevLead.status,
                newStatus: savedLead.status,
                changedBy: userId || null,
                reason: strategyParams.reassign ? 'Counselor reassigned' : `Counselor assigned via strategy: ${strategyType}`,
                metadata: {
                    assigned_by: userId || null,
                    assigned_to: counselorId,
                    timestamp: new Date().toISOString(),
                    school_id: schoolId,
                    academic_year_id: academicYearId,
                    correlation_id: correlationId || null,
                    ip: strategyParams.ip || null,
                    browser: strategyParams.browser || null
                },
                correlationId,
                eventName: 'LeadCounselorAssigned',
            });
            await this.auditService.logAudit({
                userId: userId || null,
                action: strategyParams.reassign ? 'REASSIGN_COUNSELOR' : 'ASSIGN_COUNSELOR',
                entityName: 'admission_leads',
                entityId: savedLead.id,
                beforeState: prevLead,
                afterState: savedLead,
                correlationId,
            });
        };
        // Case 2: Lead already assigned to SAME counselor (Idempotency)
        if (lead.counselorId === counselorId) {
            const { data: existingHistory } = await (await Promise.resolve().then(() => __importStar(require('../../../../config/supabase')))).supabase
                .from('status_history')
                .select('id')
                .eq('entity_name', 'admission_leads')
                .eq('entity_id', lead.id)
                .eq('event_name', 'LeadCounselorAssigned')
                .limit(1);
            if (!existingHistory?.length) {
                await logAssignmentAudit(lead, lead);
            }
            return lead;
        }
        // Case 3: Lead assigned to DIFFERENT counselor (Reassignment Check)
        if (lead.counselorId !== null && lead.counselorId !== counselorId) {
            if (lead.status === 'LOST') {
                throw new ConflictError_1.ConflictError('Cannot reassign counselor for lost leads');
            }
        }
        // Update Lead Domain Model
        const updated = new AdmissionLead_1.AdmissionLead(lead.id, lead.enquiryId, counselorId, lead.status, lead.lostReason, lead.createdAt, new Date(), lead.deletedAt);
        let saved;
        try {
            saved = await this.leadRepo.saveWithOptimisticLock(updated, actualUpdatedAt);
        }
        catch (error) {
            if (error.message === 'OPTIMISTIC_LOCK_FAILED') {
                throw new ConflictError_1.ConflictError('Concurrent modification detected during assignment check.');
            }
            throw error;
        }
        // Log Status History / Assignment change
        await logAssignmentAudit(saved, lead);
        return saved;
    }
}
exports.CounselorAssignmentService = CounselorAssignmentService;
