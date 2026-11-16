import { z } from 'zod';

export const ValidationSeverityEnum = z.enum(['ERROR', 'WARNING', 'INFO', 'UNSUPPORTED']);
export type ValidationSeverity = z.infer<typeof ValidationSeverityEnum>;

export const ValidationCategoryEnum = z.enum([
  'ACADEMIC_YEAR',
  'GRADES_AND_SECTIONS',
  'BOARD_AND_FRAMEWORK',
  'SUBJECT_MAPPING',
  'CURRICULUM',
  'SYLLABUS',
  'ACADEMIC_CALENDAR',
  'FACULTY',
  'TIMETABLE',
  'CLASSROOMS',
  'DIGITAL_RESOURCES',
  'LESSON_PLANNING',
]);
export type ValidationCategory = z.infer<typeof ValidationCategoryEnum>;

export const ValidationStatusEnum = z.enum(['PASSED', 'FAILED', 'WARNING', 'UNSUPPORTED']);
export type ValidationStatus = z.infer<typeof ValidationStatusEnum>;

export const PublishingEligibilityEnum = z.enum([
  'READY_TO_PUBLISH',
  'BLOCKED',
  'NEEDS_REVIEW',
  'UNSUPPORTED',
]);
export type PublishingEligibility = z.infer<typeof PublishingEligibilityEnum>;

export interface ValidationFinding {
  rule_code: string;
  category: ValidationCategory;
  severity: ValidationSeverity;
  title: string;
  description: string;
  entity_type: string;
  entity_id?: string | null;
  remediation_guidance: string;
  blocking: boolean;
  validation_status: ValidationStatus;
}

export interface CategoryReadinessResult {
  category: ValidationCategory;
  display_name: string;
  status: ValidationStatus;
  score: number;
  checks_count: number;
  passed_count: number;
  failed_count: number;
  warnings_count: number;
  unsupported_count: number;
  findings: ValidationFinding[];
}

export interface DependencyGraphNode {
  id: string;
  type: string;
  label: string;
  status: 'CONFIGURED' | 'PARTIAL' | 'MISSING' | 'UNSUPPORTED';
  metadata?: Record<string, any>;
}

export interface DependencyGraphEdge {
  from: string;
  to: string;
  relationship: string;
  verified: boolean;
}

export interface DependencyGraphResult {
  academic_year_id: string;
  nodes: DependencyGraphNode[];
  edges: DependencyGraphEdge[];
  summary: {
    total_nodes: number;
    total_edges: number;
    configured_nodes: number;
    missing_nodes: number;
  };
}

export interface ReadinessSummary {
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  unsupported: number;
  categories_count: number;
  evaluated_categories: number;
}

export interface AcademicYearReadinessReport {
  organization_id: string;
  academic_year_id: string;
  academic_year_name: string;
  academic_year_status: string;
  evaluated_at: string;
  overall_score: number;
  readiness_status: 'READY' | 'NEEDS_ATTENTION' | 'BLOCKED';
  publishing_eligibility: PublishingEligibility;
  summary: ReadinessSummary;
  categories: CategoryReadinessResult[];
  blocking_errors: ValidationFinding[];
  warnings: ValidationFinding[];
  unsupported_checks: ValidationFinding[];
}

// ── Query DTOs ──────────────────────────────────────────────────────────────

export const getReadinessFindingsSchema = z.object({
  category: ValidationCategoryEnum.optional(),
  severity: ValidationSeverityEnum.optional(),
  blocking_only: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type GetReadinessFindingsInput = z.infer<typeof getReadinessFindingsSchema>;

export const academicYearIdParamSchema = z.object({
  academicYearId: z.string().uuid(),
});
export type AcademicYearIdParamInput = z.infer<typeof academicYearIdParamSchema>;
