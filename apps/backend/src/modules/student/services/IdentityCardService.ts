import { IdentityRepository } from '../repositories/IdentityRepository';
import { StudentRepository } from '../repositories/StudentRepository';
import { StudentValidationCoordinator } from './validators/StudentValidationCoordinator';
import { StudentIdentity } from '../domain/StudentIdentity';
import { AuditService } from '../../admission/services/AuditService';

export class IdentityCardService {
    constructor(
        private readonly identityRepo: IdentityRepository,
        private readonly studentRepo: StudentRepository,
        private readonly validationCoordinator: StudentValidationCoordinator,
        private readonly auditService: AuditService
    ) {}

    public async generateIdCard(
        studentId: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<StudentIdentity> {
        await this.validationCoordinator.validateIdentityCard(studentId);

        const student = await this.studentRepo.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        // Check if already exists
        let identity = await this.identityRepo.findByStudentId(studentId);
        if (!identity) {
            // Generate standard format barcode string: e.g. BARCODE-STU-{admissionNo}
            const barcodeVal = `BARCODE-STU-${student.admissionNo}`;
            identity = new StudentIdentity(
                crypto.randomUUID(),
                studentId,
                barcodeVal,
                null,
                false,
                null,
                new Date()
            );
            await this.identityRepo.saveIdentity(identity);

            // Also register in student_barcodes
            await this.identityRepo.saveBarcode({
                id: crypto.randomUUID(),
                studentId,
                barcodeValue: barcodeVal,
                symbology: 'CODE128'
            });
        }

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'STUDENT_ID_CARD_GENERATED',
            entityName: 'student_identity_cards',
            entityId: identity.id,
            afterState: { barcode: identity.barcode },
            userId: performedBy,
            correlationId
        });

        return identity;
    }
}
