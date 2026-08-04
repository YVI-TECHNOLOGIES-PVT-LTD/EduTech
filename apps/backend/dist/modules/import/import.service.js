"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const student_strategy_1 = require("./strategies/student.strategy");
const vehicle_strategy_1 = require("./strategies/vehicle.strategy");
const driver_strategy_1 = require("./strategies/driver.strategy");
const mapping_strategy_1 = require("./strategies/mapping.strategy");
const faculty_strategy_1 = require("./strategies/faculty.strategy");
const facultyProfileImport_strategy_1 = require("./strategies/facultyProfileImport.strategy");
const staffProfileImport_strategy_1 = require("./strategies/staffProfileImport.strategy");
const subjectImport_strategy_1 = require("./strategies/subjectImport.strategy");
const file_parser_1 = require("./utils/file.parser");
const supabase_1 = require("../../config/supabase");
class ImportService {
    static getStrategy(entityType) {
        switch (entityType) {
            case 'STUDENT':
                return new student_strategy_1.StudentImportStrategy();
            case 'VEHICLE':
                return new vehicle_strategy_1.VehicleImportStrategy();
            case 'DRIVER':
                return new driver_strategy_1.DriverImportStrategy();
            case 'DRIVER_VEHICLE_MAP':
                return new mapping_strategy_1.DriverVehicleMappingStrategy();
            case 'FACULTY':
                return new faculty_strategy_1.FacultyImportStrategy();
            case 'FACULTY_PROFILE':
                return new facultyProfileImport_strategy_1.FacultyProfileImportStrategy();
            case 'STAFF_PROFILE':
                return new staffProfileImport_strategy_1.StaffProfileImportStrategy();
            case 'SUBJECT':
                return new subjectImport_strategy_1.SubjectImportStrategy();
            default:
                throw new Error(`Import strategy for ${entityType} not implemented`);
        }
    }
    /**
     * Step 1: Parse and Validate File
     */
    static async validateFile(fileBuffer, mimeType, entityType, schoolId, options) {
        let rows = [];
        // Parse
        // Parse
        if (mimeType.includes('csv') || mimeType === 'text/csv') {
            rows = await file_parser_1.FileParser.parseCsv(fileBuffer);
        }
        else if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
            rows = file_parser_1.FileParser.parseExcel(fileBuffer);
        }
        else if (mimeType.includes('pdf')) {
            rows = await file_parser_1.FileParser.parsePdf(fileBuffer);
        }
        else {
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
    static async executeImport(entityType, rows, context) {
        const strategy = this.getStrategy(entityType);
        // Create Job Record
        const { data: job, error: jobError } = await supabase_1.supabase
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
        await supabase_1.supabase
            .from('import_jobs')
            .update({
            status: summary.failedCount > 0 ? (summary.successCount > 0 ? 'COMPLETED' : 'FAILED') : 'COMPLETED',
            success_count: summary.successCount,
            failed_count: summary.failedCount,
            failed_rows: summary.failedRows // JSONB
        })
            .eq('id', job.id);
        return { jobId: job.id, summary };
    }
}
exports.ImportService = ImportService;
