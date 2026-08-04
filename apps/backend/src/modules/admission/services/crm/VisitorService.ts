import { BaseService } from '../BaseService';
import { VisitorRepository } from '../../repositories/crm/VisitorRepository';
import { AdmissionVisitor, VisitType } from '../../domain/AdmissionVisitor';
import { createVisitorSchema } from '../../dto/create-visitor.dto';
import { updateVisitorSchema } from '../../dto/update-visitor.dto';
import { AuditService } from '../AuditService';
import { NotFoundError } from '../../errors/NotFoundError';

export class VisitorService extends BaseService {
    constructor(
        private readonly visitorRepo: VisitorRepository,
        private readonly auditService: AuditService
    ) {
        super();
    }

    public async checkIn(schoolId: string, payload: any, createdBy: string, correlationId?: string): Promise<AdmissionVisitor> {
        const validated = this.validate(createVisitorSchema, payload);

        const id = crypto.randomUUID();
        const visitor = new AdmissionVisitor(
            id,
            schoolId,
            validated.visitor_name,
            validated.phone,
            validated.purpose,
            new Date(),
            null,
            validated.lead_id || null,
            createdBy,
            new Date(),
            validated.counselor_id || null,
            validated.remarks || null,
            validated.visit_type as VisitType,
            null
        );

        const saved = await this.visitorRepo.save(visitor);

        await this.auditService.logAudit({
            userId: createdBy,
            action: 'INSERT',
            entityName: 'admission_visitors',
            entityId: saved.id,
            afterState: saved,
            correlationId
        });

        return saved;
    }

    public async checkOut(id: string, payload: any, correlationId?: string): Promise<AdmissionVisitor> {
        const validated = this.validate(updateVisitorSchema, payload);
        const existing = await this.visitorRepo.findById(id);
        if (!existing) {
            throw new NotFoundError(`Visitor entry with ID ${id} not found`);
        }

        const beforeState = { ...existing };

        const timeOut = validated.time_out ? new Date(validated.time_out) : new Date();
        const remarks = validated.remarks !== undefined ? validated.remarks : existing.remarks;
        const outcome = validated.visit_outcome !== undefined ? validated.visit_outcome : existing.visitOutcome;

        const updated = new AdmissionVisitor(
            existing.id,
            existing.schoolId,
            existing.visitorName,
            existing.phone,
            existing.purpose,
            existing.timeIn,
            timeOut,
            existing.leadId,
            existing.createdBy,
            existing.createdAt,
            existing.counselorId,
            remarks,
            existing.visitType,
            outcome
        );

        const saved = await this.visitorRepo.save(updated);

        await this.auditService.logAudit({
            userId: null,
            action: 'UPDATE',
            entityName: 'admission_visitors',
            entityId: saved.id,
            beforeState,
            afterState: saved,
            correlationId
        });

        return saved;
    }

    public async getVisitorById(id: string): Promise<AdmissionVisitor> {
        const visitor = await this.visitorRepo.findById(id);
        if (!visitor) {
            throw new NotFoundError(`Visitor with ID ${id} not found`);
        }
        return visitor;
    }

    public async listVisitors(
        schoolId: string,
        page: number,
        limit: number,
        filters?: Record<string, any>,
        search?: string,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: AdmissionVisitor[]; total: number }> {
        return this.visitorRepo.findAll(schoolId, page, limit, filters, search, sortColumn, sortOrder);
    }
}
