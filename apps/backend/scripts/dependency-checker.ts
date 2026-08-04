import { logger } from './logger';

/**
 * Dependency and Target Architecture Guard
 * Verifies that Foundation, Core Shared Platform (Academic & Assessment),
 * and Standalone Admission database objects are NEVER modified or dropped.
 */
export class DependencyChecker {
    private static PROTECTED_TABLES = new Set([
        // Foundation
        'users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'schools', 'login_approvals', 'auth_sync', 'workflows', 'workflow_instances', 'workflow_tasks',
        // Academic & Assessment
        'academic_years', 'classes', 'sections', 'subjects', 'curriculum', 'faculty_profiles', 'faculty_section_subjects', 'section_faculty_assignments', 'departments',
        'question_banks', 'question_items', 'assessment_templates', 'assessment_blueprints', 'assessment_papers', 'assessment_evaluations', 'assessment_results',
        // Admission
        'admission_applications', 'admission_documents', 'admission_evaluations', 'admission_assessments', 'admission_enrollments', 'admission_fee_snapshots', 'admission_payment_records', 'admission_fee_waivers', 'crm_leads'
    ]);

    public static verifySafety(sqlContent: string, fileName: string): { safe: boolean; violations: string[] } {
        const violations: string[] = [];
        const normalizedSql = sqlContent.toLowerCase();

        for (const tableName of DependencyChecker.PROTECTED_TABLES) {
            // Check for dangerous DDL operations on protected tables
            const dropRegex = new RegExp(`drop\\s+table\\s+(if\\s+exists\\s+)?(public\\.)?${tableName}\\b`, 'i');
            const alterDropRegex = new RegExp(`alter\\s+table\\s+(public\\.)?${tableName}\\s+drop\\b`, 'i');

            if (dropRegex.test(normalizedSql) || alterDropRegex.test(normalizedSql)) {
                violations.push(`Migration '${fileName}' attempts to DROP protected object '${tableName}'.`);
            }
        }

        const safe = violations.length === 0;
        if (!safe) {
            for (const violation of violations) {
                logger.error(`[SAFETY VIOLATION] ${violation}`);
            }
        }

        return { safe, violations };
    }
}
