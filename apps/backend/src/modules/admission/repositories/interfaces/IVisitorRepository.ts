import { AdmissionVisitor } from '../../domain/AdmissionVisitor';

export interface IVisitorRepository {
    findById(id: string): Promise<AdmissionVisitor | null>;
    save(visitor: AdmissionVisitor): Promise<AdmissionVisitor>;
    findAll(schoolId: string, page: number, limit: number): Promise<{ data: AdmissionVisitor[]; total: number }>;
}
