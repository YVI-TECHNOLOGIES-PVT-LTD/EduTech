"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityCardService = void 0;
const StudentIdentity_1 = require("../domain/StudentIdentity");
class IdentityCardService {
    constructor(identityRepo, studentRepo, validationCoordinator, auditService) {
        this.identityRepo = identityRepo;
        this.studentRepo = studentRepo;
        this.validationCoordinator = validationCoordinator;
        this.auditService = auditService;
    }
    async generateIdCard(studentId, performedBy, correlationId) {
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
            identity = new StudentIdentity_1.StudentIdentity(crypto.randomUUID(), studentId, barcodeVal, null, false, null, new Date());
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
exports.IdentityCardService = IdentityCardService;
