import { AdmissionApplication } from '../../domain/AdmissionApplication';

export interface IAdmissionRepository {
    findById(id: string): Promise<AdmissionApplication | null>;
    save(application: AdmissionApplication): Promise<AdmissionApplication>;
    softDelete(id: string): Promise<void>;
}
