import { StudentValidator } from './StudentValidator';
import { AcademicValidator } from './AcademicValidator';
import { SectionCapacityValidator } from './SectionCapacityValidator';
import { PromotionValidator } from './PromotionValidator';
import { TransferValidator } from './TransferValidator';
import { IdentityValidator } from './IdentityValidator';

export class StudentValidationCoordinator {
    constructor(
        private readonly studentVal: StudentValidator,
        private readonly academicVal: AcademicValidator,
        private readonly capacityVal: SectionCapacityValidator,
        private readonly promotionVal: PromotionValidator,
        private readonly transferVal: TransferValidator,
        private readonly identityVal: IdentityValidator
    ) {}

    public async validateClassAllocation(
        studentId: string,
        academicYearId: string,
        grade: string,
        sectionId: string
    ): Promise<void> {
        await this.studentVal.validate(studentId);
        await this.capacityVal.validate(academicYearId, grade, sectionId);
    }

    public async validatePromotion(studentId: string): Promise<void> {
        await this.studentVal.validate(studentId);
        await this.promotionVal.validate(studentId);
    }

    public async validateTransfer(studentId: string): Promise<void> {
        await this.studentVal.validate(studentId);
        await this.transferVal.validate(studentId);
    }

    public async validateIdentityCard(studentId: string): Promise<void> {
        await this.studentVal.validate(studentId);
        await this.identityVal.validate(studentId);
    }
}
