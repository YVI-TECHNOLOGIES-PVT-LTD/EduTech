export interface CreateFeeStructureDto {
    name: string;
    effective_from: string;
    effective_to: string;
    classes: string[]; // target class UUIDs
    components: {
        name: string;
        category: 'Admission' | 'Tuition' | 'Registration' | 'Exam' | 'Lab' | 'Library' | 'Sports' | 'Transport' | 'Hostel' | 'Annual' | 'Miscellaneous';
        amount: number;
        display_order: number;
        is_mandatory: boolean;
    }[];
    installments?: {
        term: string;
        due_date: string;
        percentage?: number;
        fixed_amount?: number;
    }[];
}
