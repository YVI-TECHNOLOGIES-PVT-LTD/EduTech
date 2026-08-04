import { AdmissionApplication } from '../../domain/application/AdmissionApplication';
import { ApplicationProfile } from '../../domain/application/ApplicationProfile';
import { ApplicationDeclaration } from '../../domain/application/ApplicationDeclaration';

export interface IApplicationRepository {
    findById(id: string): Promise<AdmissionApplication | null>;
    findCurrentByLeadId(leadId: string): Promise<AdmissionApplication | null>;
    findCurrentByDetails(studentName: string, dateOfBirth: Date, academicYearId: string): Promise<AdmissionApplication | null>;
    save(application: AdmissionApplication): Promise<void>;
    
    findTimeline(applicationId: string): Promise<any[]>;
    
    findProfile(applicationId: string): Promise<ApplicationProfile | null>;
    saveProfile(profile: ApplicationProfile): Promise<void>;
    
    findParents(applicationId: string): Promise<any | null>;
    saveParents(applicationId: string, parentsData: any): Promise<void>;
    
    findPreviousEducation(applicationId: string): Promise<any | null>;
    savePreviousEducation(applicationId: string, eduData: any): Promise<void>;
    
    findPreferences(applicationId: string): Promise<any | null>;
    savePreferences(applicationId: string, prefData: any): Promise<void>;
    
    findDeclaration(applicationId: string): Promise<ApplicationDeclaration | null>;
    saveDeclaration(declaration: ApplicationDeclaration): Promise<void>;
    
    logWorkflow(
        applicationId: string, 
        action: string, 
        fromStatus: string | null, 
        toStatus: string, 
        performedBy: string | null, 
        notes?: string | null
    ): Promise<void>;

    getAgeRule(grade: string): Promise<{ min_age: number, max_age: number } | null>;
    getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean>;
}
