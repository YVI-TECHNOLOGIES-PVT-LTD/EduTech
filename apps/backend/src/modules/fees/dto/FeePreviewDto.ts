export interface FeeStructureDto {
    id: string;
    name: string;
    version: number;
    effectiveFrom: string;
    effectiveTo: string;
    academicYearId: string;
}

export interface FeeComponentDto {
    id: string;
    name: string;
    category: string;
    amount: number;
    isMandatory: boolean;
}

export interface FeeInstallmentDto {
    id: string;
    term: string;
    dueDate: string;
    percentage: number | null;
    fixedAmount: number | null;
}

export interface FeePreviewResponseDto {
    applicationId: string;
    classId: string;
    academicYearId: string;
    legacyStructureId: string | null;
    structure: FeeStructureDto;
    components: FeeComponentDto[];
    installments: FeeInstallmentDto[];
    totalAmount: number;
    currency: string;
}

export interface FinanceApiErrorDto {
    code: string;
    message: string;
    details?: string;
}
