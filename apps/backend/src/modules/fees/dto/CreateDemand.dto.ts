export interface CreateDemandDto {
    application_id?: string;
    student_id?: string;
    fee_structure_id: string;
    due_date: string;
}
