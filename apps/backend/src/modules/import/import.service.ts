import { StudentImportStrategy } from './strategies/student.strategy';
import { VehicleImportStrategy } from './strategies/vehicle.strategy';
import { DriverImportStrategy } from './strategies/driver.strategy';
import { DriverVehicleMappingStrategy } from './strategies/mapping.strategy';
import { FacultyImportStrategy } from './strategies/faculty.strategy';
import { FacultyProfileImportStrategy } from './strategies/facultyProfileImport.strategy';
import { StaffProfileImportStrategy } from './strategies/staffProfileImport.strategy';
import { SubjectImportStrategy } from './strategies/subjectImport.strategy';
import { ImportStrategy, ValidationSummary, ExecutionSummary, ImportOptions } from './import.types';
import { FileParser } from './utils/file.parser';
import { supabase } from '../../config/supabase';

export class ImportService {

    private static getStrategy(entityType: string): ImportStrategy {
        switch (entityType) {
            case 'STUDENT':
                return new StudentImportStrategy();
            case 'VEHICLE':
                return new VehicleImportStrategy();
            case 'DRIVER':
                return new DriverImportStrategy();
            case 'DRIVER_VEHICLE_MAP':
                return new DriverVehicleMappingStrategy();
            case 'FACULTY':
                return new FacultyImportStrategy();
            case 'FACULTY_PROFILE':
                return new FacultyProfileImportStrategy();
            case 'STAFF_PROFILE':
                return new StaffProfileImportStrategy();
            case 'SUBJECT':
                return new SubjectImportStrategy();
            default:
                throw new Error(`Import strategy for ${entityType} not implemented`);
        }
    }

    /**
     * Step 1: Parse and Validate File
     */
    static async validateFile(fileBuffer: Buffer, mimeType: string, entityType: string, schoolId: string, options?: ImportOptions): Promise<ValidationSummary> {
        let rows: any[] = [];

        // Parse
        // Parse
        if (mimeType.includes('csv') || mimeType === 'text/csv') {
            rows = await FileParser.parseCsv(fileBuffer);
        } else if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
            rows = FileParser.parseExcel(fileBuffer);
        } else if (mimeType.includes('pdf')) {
            rows = await FileParser.parsePdf(fileBuffer);
        } else {
            throw new Error('Unsupported file type. Use CSV, Excel, or tabular PDF.');
        }

        if (rows.length > 500) {
            throw new Error('Row limit exceeded. Max 500 rows allowed.');
        }

        // Validate
        const strategy = this.getStrategy(entityType);
        return await strategy.validate(rows, schoolId, options);
    }

    /**
     * Step 2: Execute Import
     */
    static async executeImport(
        entityType: string,
        rows: any[],
        context: { schoolId: string; userId: string; userMode?: 'STRICT' | 'AUTO_CREATE' }
    ): Promise<{ jobId: string; summary: ExecutionSummary }> {

        const strategy = this.getStrategy(entityType);

        // Create Job Record
        const { data: job, error: jobError } = await supabase
            .from('import_jobs')
            .insert({
                school_id: context.schoolId,
                entity_type: entityType,
                status: 'PROCESSING',
                total_rows: rows.length,
                created_by: context.userId
            })
            .select()
            .single();

        if (jobError) {
            console.error("[Import Service] Failed to create job record:", jobError);
            throw new Error(`Failed to create import job: ${jobError.message}`);
        }

        // Execute
        const summary = await strategy.execute(rows, { ...context, jobId: job.id });

        // Update Job Record
        await supabase
            .from('import_jobs')
            .update({
                status: summary.failedCount > 0 ? (summary.successCount > 0 ? 'COMPLETED' : 'FAILED') : 'COMPLETED',
                success_count: summary.successCount,
                failed_count: summary.failedCount,
                failed_rows: summary.failedRows as any // JSONB
            })
            .eq('id', job.id);

        return { jobId: job.id, summary };
    }
}
