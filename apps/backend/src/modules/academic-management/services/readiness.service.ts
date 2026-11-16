import {
  ReadinessRepository,
  FullAcademicReadinessData,
} from '../repositories/readiness.repository';
import {
  ValidationFinding,
  ValidationCategory,
  ValidationSeverity,
  CategoryReadinessResult,
  AcademicYearReadinessReport,
  GetReadinessFindingsInput,
  PublishingEligibility,
  DependencyGraphResult,
  DependencyGraphNode,
  DependencyGraphEdge,
} from '../dto/request/readiness.dto';
import { TimetableConflictService } from './timetable-conflict.service';
import { AcademicError } from '../errors/academic.errors';

export class AcademicReadinessService {
  /**
   * Validate full academic year configuration across all 12 domains
   */
  static async validateAcademicYear(
    orgId: string,
    academicYearId: string,
  ): Promise<AcademicYearReadinessReport> {
    const data = await ReadinessRepository.getAcademicConfiguration(orgId, academicYearId);
    if (!data) {
      throw new AcademicError(
        `Academic year '${academicYearId}' was not found or does not belong to your organization.`,
        404,
        'NOT_FOUND',
      );
    }

    // Reuse Phase 6 Conflict Detection if a published timetable version exists
    let timetableConflictAnalysis: any = null;
    if (data.timetableConfig.published_version_id) {
      try {
        timetableConflictAnalysis = await TimetableConflictService.detectConflicts(
          orgId,
          data.timetableConfig.published_version_id,
        );
      } catch {
        // Fallback if conflict engine encounters missing version
      }
    }

    const categories: CategoryReadinessResult[] = [];

    // 1. ACADEMIC_YEAR
    categories.push(this.validateAcademicYearDomain(data));

    // 2. GRADES_AND_SECTIONS
    categories.push(this.validateGradesAndSectionsDomain(data));

    // 3. BOARD_AND_FRAMEWORK
    categories.push(this.validateBoardAndFrameworkDomain(data));

    // 4. SUBJECT_MAPPING
    categories.push(this.validateSubjectMappingDomain(data));

    // 5. CURRICULUM
    categories.push(this.validateCurriculumDomain(data));

    // 6. SYLLABUS
    categories.push(this.validateSyllabusDomain(data));

    // 7. ACADEMIC_CALENDAR
    categories.push(this.validateAcademicCalendarDomain(data));

    // 8. FACULTY
    categories.push(this.validateFacultyDomain(data));

    // 9. TIMETABLE
    categories.push(this.validateTimetableDomain(data, timetableConflictAnalysis));

    // 10. CLASSROOMS
    categories.push(this.validateClassroomsDomain(data, timetableConflictAnalysis));

    // 11. DIGITAL_RESOURCES
    categories.push(this.validateDigitalResourcesDomain(data));

    // 12. LESSON_PLANNING
    categories.push(this.validateLessonPlanningDomain(data));

    // Aggregate findings
    const allFindings: ValidationFinding[] = [];
    for (const cat of categories) {
      allFindings.push(...cat.findings);
    }

    const blockingErrors = allFindings.filter((f) => f.blocking && f.severity === 'ERROR');
    const warnings = allFindings.filter((f) => f.severity === 'WARNING');
    const unsupportedChecks = allFindings.filter((f) => f.severity === 'UNSUPPORTED');
    const passedCount = allFindings.filter((f) => f.validation_status === 'PASSED').length;
    const failedCount = allFindings.filter((f) => f.validation_status === 'FAILED').length;
    const warningsCount = warnings.length;
    const unsupportedCount = unsupportedChecks.length;
    const totalChecks = allFindings.length;

    // Transparent score calculation:
    // Only evaluable checks (passed + failed + warnings) contribute to score
    const evaluableCount = passedCount + failedCount + warningsCount;
    let overallScore = 0;
    if (evaluableCount > 0) {
      // Full credit for passed, half credit for warnings, 0 for failed
      overallScore = Math.round(((passedCount + 0.5 * warningsCount) / evaluableCount) * 100);
    }

    // Determine readiness status and publishing eligibility
    let readinessStatus: 'READY' | 'NEEDS_ATTENTION' | 'BLOCKED' = 'READY';
    let publishingEligibility: PublishingEligibility = 'READY_TO_PUBLISH';

    if (blockingErrors.length > 0) {
      readinessStatus = 'BLOCKED';
      publishingEligibility = 'BLOCKED';
    } else if (overallScore < 80 || warningsCount > 4) {
      readinessStatus = 'NEEDS_ATTENTION';
      publishingEligibility = 'NEEDS_REVIEW';
    } else {
      readinessStatus = 'READY';
      publishingEligibility = 'READY_TO_PUBLISH';
    }

    return {
      organization_id: orgId,
      academic_year_id: academicYearId,
      academic_year_name: data.yearConfig.academic_year_name,
      academic_year_status: data.yearConfig.status,
      evaluated_at: new Date().toISOString(),
      overall_score: overallScore,
      readiness_status: readinessStatus,
      publishing_eligibility: publishingEligibility,
      summary: {
        total_checks: totalChecks,
        passed: passedCount,
        failed: failedCount,
        warnings: warningsCount,
        unsupported: unsupportedCount,
        categories_count: categories.length,
        evaluated_categories: categories.filter((c) => c.status !== 'UNSUPPORTED').length,
      },
      categories,
      blocking_errors: blockingErrors,
      warnings,
      unsupported_checks: unsupportedChecks,
    };
  }

  /**
   * Filter and paginate findings from readiness report
   */
  static async getFindings(
    orgId: string,
    academicYearId: string,
    query: GetReadinessFindingsInput,
  ): Promise<{
    items: ValidationFinding[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const report = await this.validateAcademicYear(orgId, academicYearId);
    let all = report.categories.flatMap((c) => c.findings);

    if (query.category) {
      all = all.filter((f) => f.category === query.category);
    }
    if (query.severity) {
      all = all.filter((f) => f.severity === query.severity);
    }
    if (query.blocking_only) {
      all = all.filter((f) => f.blocking);
    }

    const total = all.length;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const items = all.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Return category summaries
   */
  static async getCategories(
    orgId: string,
    academicYearId: string,
  ): Promise<CategoryReadinessResult[]> {
    const report = await this.validateAcademicYear(orgId, academicYearId);
    return report.categories;
  }

  /**
   * Generate academic dependency graph for visualization
   */
  static async getDependencyGraph(
    orgId: string,
    academicYearId: string,
  ): Promise<DependencyGraphResult> {
    const data = await ReadinessRepository.getAcademicConfiguration(orgId, academicYearId);
    if (!data) {
      throw new AcademicError(
        `Academic year '${academicYearId}' was not found or does not belong to your organization.`,
        404,
        'NOT_FOUND',
      );
    }

    const nodes: DependencyGraphNode[] = [];
    const edges: DependencyGraphEdge[] = [];

    // 1. Root Organization
    const orgNodeId = `org_${data.yearConfig.org_id}`;
    nodes.push({
      id: orgNodeId,
      type: 'ORGANIZATION',
      label: data.yearConfig.org_name,
      status: 'CONFIGURED',
      metadata: { board_affiliation: data.yearConfig.board_affiliation },
    });

    // 2. Academic Year
    const ayNodeId = `ay_${data.yearConfig.academic_year_id}`;
    nodes.push({
      id: ayNodeId,
      type: 'ACADEMIC_YEAR',
      label: data.yearConfig.academic_year_name,
      status: 'CONFIGURED',
      metadata: {
        status: data.yearConfig.status,
        start_date: data.yearConfig.start_date,
        end_date: data.yearConfig.end_date,
      },
    });
    edges.push({ from: orgNodeId, to: ayNodeId, relationship: 'MANAGES', verified: true });

    // 3. Academic Calendar
    const calNodeId = data.calendarConfig.calendar_id
      ? `cal_${data.calendarConfig.calendar_id}`
      : `cal_missing_${academicYearId}`;
    nodes.push({
      id: calNodeId,
      type: 'CALENDAR',
      label: data.calendarConfig.calendar_id
        ? `Academic Calendar (v${data.calendarConfig.version})`
        : 'Academic Calendar (Missing)',
      status: data.calendarConfig.calendar_id ? 'CONFIGURED' : 'MISSING',
      metadata: { terms_count: data.calendarConfig.terms_count },
    });
    edges.push({
      from: ayNodeId,
      to: calNodeId,
      relationship: 'SCHEDULES',
      verified: !!data.calendarConfig.calendar_id,
    });

    // 4. Timetable
    const ttNodeId = data.timetableConfig.published_version_id
      ? `tt_${data.timetableConfig.published_version_id}`
      : `tt_missing_${academicYearId}`;
    nodes.push({
      id: ttNodeId,
      type: 'TIMETABLE',
      label: data.timetableConfig.published_version_id
        ? `Published Timetable (v${data.timetableConfig.published_version_number})`
        : 'Timetable (Unpublished)',
      status: data.timetableConfig.published_version_id ? 'CONFIGURED' : 'PARTIAL',
      metadata: {
        published_entries: data.timetableConfig.published_entries_count,
        sections_covered: data.timetableConfig.sections_scheduled_count,
      },
    });
    edges.push({
      from: ayNodeId,
      to: ttNodeId,
      relationship: 'TIMETABLED_BY',
      verified: !!data.timetableConfig.published_version_id,
    });

    // 5. Grade Offerings & Sub-trees
    for (const go of data.gradeOfferings) {
      const gNodeId = `grade_${go.grade_id}`;
      nodes.push({
        id: gNodeId,
        type: 'GRADE',
        label: go.grade_name,
        status: go.is_active ? 'CONFIGURED' : 'PARTIAL',
        metadata: {
          code: go.grade_code,
          board: go.grade_board,
          sections_count: go.sections_count,
          subjects_count: go.subjects_count,
        },
      });
      edges.push({ from: ayNodeId, to: gNodeId, relationship: 'OFFERS', verified: true });

      // Sections under Grade
      const gradeSections = data.sections.filter(
        (s) => s.academic_year_grade_id === go.academic_year_grade_id,
      );
      for (const s of gradeSections) {
        const sNodeId = `sec_${s.section_id}`;
        nodes.push({
          id: sNodeId,
          type: 'SECTION',
          label: `${go.grade_name} - ${s.section_name}`,
          status: s.class_teacher_id ? 'CONFIGURED' : 'PARTIAL',
          metadata: {
            capacity: s.capacity,
            class_teacher: s.class_teacher_name,
          },
        });
        edges.push({ from: gNodeId, to: sNodeId, relationship: 'DIVIDES_INTO', verified: true });
        if (data.timetableConfig.published_version_id) {
          edges.push({ from: sNodeId, to: ttNodeId, relationship: 'SCHEDULED_IN', verified: true });
        }
      }

      // Subjects under Grade
      const gradeSubjects = data.subjectMappings.filter(
        (sm) => sm.academic_year_grade_id === go.academic_year_grade_id,
      );
      for (const sm of gradeSubjects) {
        const subNodeId = `aygs_${sm.academic_year_grade_subject_id}`;
        nodes.push({
          id: subNodeId,
          type: 'SUBJECT_MAPPING',
          label: `${go.grade_name}: ${sm.subject_name}`,
          status: sm.has_curriculum_plan ? 'CONFIGURED' : 'PARTIAL',
          metadata: {
            code: sm.subject_code,
            curriculum_plan_status: sm.curriculum_plan_status,
            faculty_assigned: sm.faculty_assigned_count > 0,
          },
        });
        edges.push({ from: gNodeId, to: subNodeId, relationship: 'TEACHES', verified: true });
      }
    }

    const configuredCount = nodes.filter((n) => n.status === 'CONFIGURED').length;
    const missingCount = nodes.filter((n) => n.status === 'MISSING').length;

    return {
      academic_year_id: academicYearId,
      nodes,
      edges,
      summary: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        configured_nodes: configuredCount,
        missing_nodes: missingCount,
      },
    };
  }

  /**
   * Tenant-wide overview across academic years
   */
  static async getTenantOverview(orgId: string): Promise<any> {
    return ReadinessRepository.getTenantReadinessOverview(orgId);
  }

  /**
   * Unsupported Global Publish Handler (HTTP 501)
   */
  static handlePublishUnsupported(): never {
    throw new AcademicError(
      'Global academic setup publishing is not supported as a single monolithic operation. The database does not possess a global publication table. Individual academic components must be published through their respective authorized domain operations (e.g., Timetable publication, Curriculum plan publication, Academic Year status transition).',
      501,
      'FEATURE_NOT_IMPLEMENTED',
      { limitation_code: 'GLOBAL_ACADEMIC_PUBLISH_UNSUPPORTED' },
    );
  }

  // ── PRIVATE DOMAIN VALIDATION IMPLEMENTATIONS ─────────────────────────────

  private static validateAcademicYearDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const c = data.yearConfig;

    // AY_DATE_ORDER
    const startDate = new Date(c.start_date);
    const endDate = new Date(c.end_date);
    if (startDate >= endDate) {
      findings.push({
        rule_code: 'AY_DATE_ORDER_INVALID',
        category: 'ACADEMIC_YEAR',
        severity: 'ERROR',
        title: 'Academic year date range is invalid',
        description: `Start date (${c.start_date}) must strictly precede end date (${c.end_date}).`,
        entity_type: 'academic_years',
        entity_id: c.academic_year_id,
        remediation_guidance: 'Adjust academic year dates to ensure a valid chronological period.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else {
      findings.push({
        rule_code: 'AY_DATE_ORDER_VALID',
        category: 'ACADEMIC_YEAR',
        severity: 'INFO',
        title: 'Academic year date sequence is valid',
        description: `Academic year spans from ${c.start_date.split('T')[0]} to ${c.end_date.split('T')[0]}.`,
        entity_type: 'academic_years',
        entity_id: c.academic_year_id,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    // AY_GRADE_OFFERINGS_PRESENT
    if (data.gradeOfferings.length === 0) {
      findings.push({
        rule_code: 'AY_NO_GRADE_OFFERINGS',
        category: 'ACADEMIC_YEAR',
        severity: 'ERROR',
        title: 'No grade offerings configured for academic year',
        description: 'The academic year has zero active grade offerings mapped.',
        entity_type: 'academic_years',
        entity_id: c.academic_year_id,
        remediation_guidance:
          'Map institutional grades to this academic year under Academic Year Grades setup.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else {
      findings.push({
        rule_code: 'AY_GRADE_OFFERINGS_CONFIGURED',
        category: 'ACADEMIC_YEAR',
        severity: 'INFO',
        title: 'Grade offerings configured',
        description: `${data.gradeOfferings.length} grade offerings mapped to this session.`,
        entity_type: 'academic_years',
        entity_id: c.academic_year_id,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    // AY_LIFECYCLE_STATUS
    if (c.status === 'planning') {
      findings.push({
        rule_code: 'AY_STATUS_PLANNING',
        category: 'ACADEMIC_YEAR',
        severity: 'WARNING',
        title: 'Academic year is in planning status',
        description:
          'The academic session has not yet transitioned to admissions_open, open, or teaching.',
        entity_type: 'academic_years',
        entity_id: c.academic_year_id,
        remediation_guidance:
          'Transition academic year to open or teaching when ready for student enrollment.',
        blocking: false,
        validation_status: 'WARNING',
      });
    }

    return this.buildCategoryResult('ACADEMIC_YEAR', 'Academic Year Configuration', findings);
  }

  private static validateGradesAndSectionsDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];

    // Check for grades without sections
    const gradesWithoutSections = data.gradeOfferings.filter((go) => go.sections_count === 0);
    if (gradesWithoutSections.length > 0) {
      findings.push({
        rule_code: 'GRADE_MISSING_SECTIONS',
        category: 'GRADES_AND_SECTIONS',
        severity: 'ERROR',
        title: 'Grades missing section divisions',
        description: `${gradesWithoutSections.length} grade offering(s) have no sections configured (${gradesWithoutSections.map((g) => g.grade_name).join(', ')}).`,
        entity_type: 'grades',
        entity_id: gradesWithoutSections[0].grade_id,
        remediation_guidance:
          'Create at least one active section (e.g., Section A) for every active grade offering.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else {
      findings.push({
        rule_code: 'GRADE_SECTIONS_COMPLETE',
        category: 'GRADES_AND_SECTIONS',
        severity: 'INFO',
        title: 'All grade offerings have configured sections',
        description: `Verified ${data.sections.length} total sections across ${data.gradeOfferings.length} grades.`,
        entity_type: 'sections',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    // Check class teacher assignments
    const sectionsWithoutTeacher = data.sections.filter((s) => !s.class_teacher_id);
    if (sectionsWithoutTeacher.length > 0) {
      findings.push({
        rule_code: 'SECTIONS_UNASSIGNED_CLASS_TEACHER',
        category: 'GRADES_AND_SECTIONS',
        severity: 'WARNING',
        title: 'Sections missing assigned class teachers',
        description: `${sectionsWithoutTeacher.length} of ${data.sections.length} sections do not have a designated class teacher.`,
        entity_type: 'sections',
        entity_id: sectionsWithoutTeacher[0].section_id,
        remediation_guidance:
          'Assign qualified faculty members as class teachers for all sections.',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else {
      findings.push({
        rule_code: 'SECTIONS_CLASS_TEACHERS_ASSIGNED',
        category: 'GRADES_AND_SECTIONS',
        severity: 'INFO',
        title: 'Class teachers assigned to all sections',
        description: 'Every configured section has an assigned class teacher.',
        entity_type: 'sections',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    // Check section capacity
    const sectionsWithoutCapacity = data.sections.filter((s) => !s.capacity || s.capacity <= 0);
    if (sectionsWithoutCapacity.length > 0) {
      findings.push({
        rule_code: 'SECTION_CAPACITY_UNSET',
        category: 'GRADES_AND_SECTIONS',
        severity: 'WARNING',
        title: 'Sections with unconfigured seating capacity',
        description: `${sectionsWithoutCapacity.length} section(s) have undefined or non-positive capacity.`,
        entity_type: 'sections',
        entity_id: sectionsWithoutCapacity[0].section_id,
        remediation_guidance:
          'Specify student capacity limits for accurate admission and timetable allocation.',
        blocking: false,
        validation_status: 'WARNING',
      });
    }

    return this.buildCategoryResult('GRADES_AND_SECTIONS', 'Grades & Sections Structure', findings);
  }

  private static validateBoardAndFrameworkDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const orgBoard = data.yearConfig.board_affiliation;

    if (!orgBoard || orgBoard.trim().length === 0) {
      findings.push({
        rule_code: 'ORG_BOARD_UNCONFIGURED',
        category: 'BOARD_AND_FRAMEWORK',
        severity: 'WARNING',
        title: 'Institutional board affiliation is unconfigured',
        description: 'Organization board affiliation is not set in physical organizations table.',
        entity_type: 'organizations',
        entity_id: data.yearConfig.org_id,
        remediation_guidance:
          'Update institutional board affiliation (e.g. CBSE, ICSE, Cambridge, IB).',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else {
      findings.push({
        rule_code: 'ORG_BOARD_CONFIGURED',
        category: 'BOARD_AND_FRAMEWORK',
        severity: 'INFO',
        title: 'Institutional board affiliation configured',
        description: `Institution is affiliated with board code '${orgBoard}'.`,
        entity_type: 'organizations',
        entity_id: data.yearConfig.org_id,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    // Check grade board consistency
    const unconfiguredGradeBoards = data.gradeOfferings.filter((go) => !go.grade_board);
    if (unconfiguredGradeBoards.length > 0) {
      findings.push({
        rule_code: 'GRADE_BOARD_UNSET',
        category: 'BOARD_AND_FRAMEWORK',
        severity: 'WARNING',
        title: 'Grades with unassigned educational board',
        description: `${unconfiguredGradeBoards.length} grade offering(s) have null board values.`,
        entity_type: 'grades',
        entity_id: unconfiguredGradeBoards[0].grade_id,
        remediation_guidance: 'Assign explicit board values to grade configurations.',
        blocking: false,
        validation_status: 'WARNING',
      });
    }

    // Explicitly document unsupported framework mappings
    findings.push({
      rule_code: 'FRAMEWORK_MAPPINGS_UNSUPPORTED',
      category: 'BOARD_AND_FRAMEWORK',
      severity: 'UNSUPPORTED',
      title: 'Educational framework hierarchy mapping unsupported',
      description:
        'Educational framework database tables are not part of the finalized Stage-1 baseline.',
      entity_type: 'educational_frameworks',
      entity_id: null,
      remediation_guidance: 'Framework mapping is planned for Stage-3 database baseline updates.',
      blocking: false,
      validation_status: 'UNSUPPORTED',
    });

    return this.buildCategoryResult(
      'BOARD_AND_FRAMEWORK',
      'Educational Board & Framework',
      findings,
    );
  }

  private static validateSubjectMappingDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];

    if (data.allOrgSubjectsCount === 0) {
      findings.push({
        rule_code: 'NO_ORG_SUBJECTS',
        category: 'SUBJECT_MAPPING',
        severity: 'ERROR',
        title: 'No academic subjects defined in organization',
        description: 'Zero active subjects exist in physical subjects table.',
        entity_type: 'subjects',
        entity_id: null,
        remediation_guidance:
          'Configure instructional disciplines and courses under Subject Management.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else {
      findings.push({
        rule_code: 'ORG_SUBJECTS_EXIST',
        category: 'SUBJECT_MAPPING',
        severity: 'INFO',
        title: 'Academic subjects available in master catalog',
        description: `Found ${data.allOrgSubjectsCount} total subjects defined.`,
        entity_type: 'subjects',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    // Check grade-subject mappings
    const gradesWithoutSubjects = data.gradeOfferings.filter((go) => go.subjects_count === 0);
    if (gradesWithoutSubjects.length > 0) {
      findings.push({
        rule_code: 'GRADE_MISSING_SUBJECT_MAPPINGS',
        category: 'SUBJECT_MAPPING',
        severity: 'ERROR',
        title: 'Grades missing subject curriculum mappings',
        description: `${gradesWithoutSubjects.length} grade offering(s) have no subjects mapped (${gradesWithoutSubjects.map((g) => g.grade_name).join(', ')}).`,
        entity_type: 'academic_year_grades',
        entity_id: gradesWithoutSubjects[0].academic_year_grade_id,
        remediation_guidance: 'Map required subjects to grade offerings for this academic year.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else {
      findings.push({
        rule_code: 'GRADE_SUBJECT_MAPPINGS_COMPLETE',
        category: 'SUBJECT_MAPPING',
        severity: 'INFO',
        title: 'Subjects mapped across all grade offerings',
        description: `${data.subjectMappings.length} total grade-subject offerings verified.`,
        entity_type: 'academic_year_grade_subjects',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    return this.buildCategoryResult(
      'SUBJECT_MAPPING',
      'Subject Catalog & Grade Mappings',
      findings,
    );
  }

  private static validateCurriculumDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];

    const totalMappings = data.subjectMappings.length;
    const mappingsWithCurriculum = data.subjectMappings.filter((sm) => sm.has_curriculum_plan);

    if (totalMappings === 0) {
      findings.push({
        rule_code: 'CURRICULUM_BLOCKED_BY_SUBJECTS',
        category: 'CURRICULUM',
        severity: 'ERROR',
        title: 'Curriculum validation blocked by missing subject mappings',
        description:
          'Cannot evaluate curriculum plans because grade-subject offerings have not been configured.',
        entity_type: 'curriculum_plans',
        entity_id: null,
        remediation_guidance: 'Configure grade-subject mappings first.',
        blocking: true,
        validation_status: 'FAILED',
      });
      return this.buildCategoryResult('CURRICULUM', 'Curriculum Framework & Plans', findings);
    }

    if (mappingsWithCurriculum.length === 0) {
      findings.push({
        rule_code: 'NO_CURRICULUM_PLANS',
        category: 'CURRICULUM',
        severity: 'ERROR',
        title: 'No curriculum plans created for academic year',
        description: 'Zero curriculum plans exist for the configured grade-subject offerings.',
        entity_type: 'curriculum_plans',
        entity_id: null,
        remediation_guidance: 'Create and publish curriculum plans for required grade subjects.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else {
      const coveragePct = Math.round((mappingsWithCurriculum.length / totalMappings) * 100);
      if (coveragePct < 80) {
        findings.push({
          rule_code: 'CURRICULUM_COVERAGE_LOW',
          category: 'CURRICULUM',
          severity: 'WARNING',
          title: 'Curriculum plan coverage is below recommended threshold',
          description: `Only ${mappingsWithCurriculum.length} of ${totalMappings} grade-subject offerings (${coveragePct}%) have defined curriculum plans.`,
          entity_type: 'curriculum_plans',
          entity_id: null,
          remediation_guidance: 'Complete curriculum plans for remaining grade subjects.',
          blocking: false,
          validation_status: 'WARNING',
        });
      } else {
        findings.push({
          rule_code: 'CURRICULUM_PLANS_SUFFICIENT',
          category: 'CURRICULUM',
          severity: 'INFO',
          title: 'Curriculum plan coverage is comprehensive',
          description: `${mappingsWithCurriculum.length} of ${totalMappings} (${coveragePct}%) offerings have curriculum plans.`,
          entity_type: 'curriculum_plans',
          entity_id: null,
          remediation_guidance: 'None required.',
          blocking: false,
          validation_status: 'PASSED',
        });
      }
    }

    // Check plans with 0 units
    const plansWithNoUnits = mappingsWithCurriculum.filter((sm) => sm.units_count === 0);
    if (plansWithNoUnits.length > 0) {
      findings.push({
        rule_code: 'CURRICULUM_EMPTY_UNITS',
        category: 'CURRICULUM',
        severity: 'ERROR',
        title: 'Curriculum plans missing syllabus units',
        description: `${plansWithNoUnits.length} curriculum plan(s) have no syllabus units defined.`,
        entity_type: 'curriculum_plan_units',
        entity_id: plansWithNoUnits[0].curriculum_plan_id,
        remediation_guidance: 'Add instructional syllabus units to all active curriculum plans.',
        blocking: true,
        validation_status: 'FAILED',
      });
    }

    return this.buildCategoryResult('CURRICULUM', 'Curriculum Framework & Plans', findings);
  }

  private static validateSyllabusDomain(data: FullAcademicReadinessData): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];

    const plansWithUnits = data.subjectMappings.filter((sm) => sm.units_count > 0);
    const plansWithOutcomes = data.subjectMappings.filter((sm) => sm.outcomes_count > 0);

    if (plansWithUnits.length === 0) {
      findings.push({
        rule_code: 'SYLLABUS_NO_UNITS',
        category: 'SYLLABUS',
        severity: 'WARNING',
        title: 'Syllabus units not populated',
        description: 'No syllabus units found to evaluate outcome mapping.',
        entity_type: 'curriculum_plan_units',
        entity_id: null,
        remediation_guidance: 'Populate syllabus units with sequential topic breakdowns.',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else {
      findings.push({
        rule_code: 'SYLLABUS_UNITS_CONFIGURED',
        category: 'SYLLABUS',
        severity: 'INFO',
        title: 'Syllabus units populated',
        description: `${plansWithUnits.reduce((acc, sm) => acc + sm.units_count, 0)} total units across curriculum plans.`,
        entity_type: 'curriculum_plan_units',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    if (plansWithOutcomes.length === 0 && plansWithUnits.length > 0) {
      findings.push({
        rule_code: 'SYLLABUS_NO_OUTCOMES',
        category: 'SYLLABUS',
        severity: 'WARNING',
        title: 'Learning outcomes missing from syllabus units',
        description: 'Syllabus units have zero defined Bloom-aligned learning outcomes.',
        entity_type: 'curriculum_learning_outcomes',
        entity_id: null,
        remediation_guidance:
          'Add measurable learning outcomes with Bloom taxonomy levels to each syllabus unit.',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else if (plansWithOutcomes.length > 0) {
      const totalOutcomes = plansWithOutcomes.reduce((acc, sm) => acc + sm.outcomes_count, 0);
      findings.push({
        rule_code: 'SYLLABUS_OUTCOMES_CONFIGURED',
        category: 'SYLLABUS',
        severity: 'INFO',
        title: 'Learning outcomes mapped to syllabus units',
        description: `${totalOutcomes} learning outcomes registered across units.`,
        entity_type: 'curriculum_learning_outcomes',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    return this.buildCategoryResult('SYLLABUS', 'Syllabus & Learning Outcomes', findings);
  }

  private static validateAcademicCalendarDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const cal = data.calendarConfig;

    if (!cal.calendar_id) {
      findings.push({
        rule_code: 'CALENDAR_MISSING',
        category: 'ACADEMIC_CALENDAR',
        severity: 'ERROR',
        title: 'Academic calendar is not configured',
        description: 'No academic calendar record found for this academic session.',
        entity_type: 'academic_calendars',
        entity_id: null,
        remediation_guidance: 'Create an academic calendar with terms, working days, and holidays.',
        blocking: true,
        validation_status: 'FAILED',
      });
      return this.buildCategoryResult('ACADEMIC_CALENDAR', 'Academic Calendar & Terms', findings);
    }

    findings.push({
      rule_code: 'CALENDAR_EXISTS',
      category: 'ACADEMIC_CALENDAR',
      severity: 'INFO',
      title: 'Academic calendar exists',
      description: `Calendar version ${cal.version} found with status '${cal.status}'.`,
      entity_type: 'academic_calendars',
      entity_id: cal.calendar_id,
      remediation_guidance: 'None required.',
      blocking: false,
      validation_status: 'PASSED',
    });

    // Check terms
    if (cal.terms_count === 0) {
      findings.push({
        rule_code: 'CALENDAR_NO_TERMS',
        category: 'ACADEMIC_CALENDAR',
        severity: 'ERROR',
        title: 'Academic terms are not configured',
        description: 'Calendar has zero defined academic terms or semesters.',
        entity_type: 'academic_terms',
        entity_id: cal.calendar_id,
        remediation_guidance: 'Define at least one academic term with start and end dates.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else {
      findings.push({
        rule_code: 'CALENDAR_TERMS_CONFIGURED',
        category: 'ACADEMIC_CALENDAR',
        severity: 'INFO',
        title: 'Academic terms configured',
        description: `${cal.terms_count} academic term(s) defined.`,
        entity_type: 'academic_terms',
        entity_id: cal.calendar_id,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    // Check working days
    if (cal.working_days.length < 5) {
      findings.push({
        rule_code: 'CALENDAR_INSUFFICIENT_WORKING_DAYS',
        category: 'ACADEMIC_CALENDAR',
        severity: 'WARNING',
        title: 'Fewer than 5 teaching working days configured',
        description: `Calendar defines only ${cal.working_days.length} working days per week.`,
        entity_type: 'academic_calendar_working_days',
        entity_id: cal.calendar_id,
        remediation_guidance:
          'Standard K-12 operational schedule expects at least 5 teaching days per week.',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else {
      findings.push({
        rule_code: 'CALENDAR_WORKING_DAYS_CONFIGURED',
        category: 'ACADEMIC_CALENDAR',
        severity: 'INFO',
        title: 'Teaching working days configured',
        description: `${cal.working_days.length} instructional weekdays configured.`,
        entity_type: 'academic_calendar_working_days',
        entity_id: cal.calendar_id,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    return this.buildCategoryResult('ACADEMIC_CALENDAR', 'Academic Calendar & Terms', findings);
  }

  private static validateFacultyDomain(data: FullAcademicReadinessData): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const fac = data.facultyConfig;

    if (fac.total_active_staff === 0) {
      findings.push({
        rule_code: 'NO_ACTIVE_FACULTY',
        category: 'FACULTY',
        severity: 'ERROR',
        title: 'No active staff or faculty members found',
        description:
          'Physical staff table contains zero active instructional personnel for this institution.',
        entity_type: 'staff',
        entity_id: null,
        remediation_guidance: 'Add faculty and staff records in Staff Management.',
        blocking: true,
        validation_status: 'FAILED',
      });
      return this.buildCategoryResult('FACULTY', 'Faculty & Staff Assignments', findings);
    }

    findings.push({
      rule_code: 'ACTIVE_FACULTY_AVAILABLE',
      category: 'FACULTY',
      severity: 'INFO',
      title: 'Active faculty personnel available',
      description: `${fac.total_active_staff} active staff members verified in institution.`,
      entity_type: 'staff',
      entity_id: null,
      remediation_guidance: 'None required.',
      blocking: false,
      validation_status: 'PASSED',
    });

    if (fac.total_assignments === 0) {
      findings.push({
        rule_code: 'NO_FACULTY_ASSIGNMENTS',
        category: 'FACULTY',
        severity: 'ERROR',
        title: 'No subject faculty assignments configured',
        description:
          'Zero faculty members are assigned to teach section subjects in this academic year.',
        entity_type: 'section_subject_faculty_assignments',
        entity_id: null,
        remediation_guidance:
          'Assign teachers to subjects across all class sections under Faculty Assignment setup.',
        blocking: true,
        validation_status: 'FAILED',
      });
    } else if (fac.unassigned_grade_subjects > 0) {
      findings.push({
        rule_code: 'UNASSIGNED_SUBJECTS_EXIST',
        category: 'FACULTY',
        severity: 'WARNING',
        title: 'Grade-subject offerings without assigned faculty',
        description: `${fac.unassigned_grade_subjects} subject offering(s) lack assigned teachers.`,
        entity_type: 'section_subject_faculty_assignments',
        entity_id: null,
        remediation_guidance: 'Assign qualified faculty to all remaining subject offerings.',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else {
      findings.push({
        rule_code: 'FACULTY_ASSIGNMENTS_COMPLETE',
        category: 'FACULTY',
        severity: 'INFO',
        title: 'Faculty assignments complete across subjects',
        description: `${fac.total_assignments} assignments configured (${fac.primary_assignments_count} primary, ${fac.co_teacher_assignments_count} co-teachers).`,
        entity_type: 'section_subject_faculty_assignments',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    return this.buildCategoryResult('FACULTY', 'Faculty & Staff Assignments', findings);
  }

  private static validateTimetableDomain(
    data: FullAcademicReadinessData,
    conflictAnalysis: any,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const tt = data.timetableConfig;

    if (!tt.published_version_id) {
      findings.push({
        rule_code: 'NO_PUBLISHED_TIMETABLE',
        category: 'TIMETABLE',
        severity: 'ERROR',
        title: 'No published timetable version found',
        description:
          'An approved, published timetable version does not exist for this academic year.',
        entity_type: 'timetable_versions',
        entity_id: null,
        remediation_guidance:
          'Generate, resolve conflicts, and publish an official timetable version.',
        blocking: true,
        validation_status: 'FAILED',
      });
      return this.buildCategoryResult('TIMETABLE', 'Timetable & Scheduling', findings);
    }

    findings.push({
      rule_code: 'TIMETABLE_PUBLISHED',
      category: 'TIMETABLE',
      severity: 'INFO',
      title: 'Published timetable version active',
      description: `Timetable version ${tt.published_version_number} is published with ${tt.published_entries_count} scheduled period entries.`,
      entity_type: 'timetable_versions',
      entity_id: tt.published_version_id,
      remediation_guidance: 'None required.',
      blocking: false,
      validation_status: 'PASSED',
    });

    // Check section coverage
    if (tt.sections_scheduled_count < tt.total_sections_count) {
      const missing = tt.total_sections_count - tt.sections_scheduled_count;
      findings.push({
        rule_code: 'TIMETABLE_PARTIAL_SECTION_COVERAGE',
        category: 'TIMETABLE',
        severity: 'WARNING',
        title: 'Timetable does not cover all active sections',
        description: `${missing} of ${tt.total_sections_count} sections have zero scheduled periods in the published timetable.`,
        entity_type: 'timetable_entries',
        entity_id: tt.published_version_id,
        remediation_guidance: 'Schedule timetable entries for all active sections.',
        blocking: false,
        validation_status: 'WARNING',
      });
    }

    // Reuse Conflict Engine Findings
    if (conflictAnalysis) {
      const cs = conflictAnalysis.conflict_summary;
      if (cs?.teacher_collisions > 0) {
        findings.push({
          rule_code: 'TIMETABLE_TEACHER_COLLISION',
          category: 'TIMETABLE',
          severity: 'ERROR',
          title: 'Teacher timetable collisions detected',
          description: `${cs.teacher_collisions} teacher collision(s) detected where a faculty member is double-booked.`,
          entity_type: 'timetable_entries',
          entity_id: tt.published_version_id,
          remediation_guidance:
            'Reassign or reschedule overlapping periods to eliminate teacher collisions.',
          blocking: true,
          validation_status: 'FAILED',
        });
      }
      if (cs?.section_collisions > 0) {
        findings.push({
          rule_code: 'TIMETABLE_SECTION_COLLISION',
          category: 'TIMETABLE',
          severity: 'ERROR',
          title: 'Section timetable collisions detected',
          description: `${cs.section_collisions} section collision(s) detected where a class has simultaneous periods.`,
          entity_type: 'timetable_entries',
          entity_id: tt.published_version_id,
          remediation_guidance: 'Resolve overlapping period schedules for affected sections.',
          blocking: true,
          validation_status: 'FAILED',
        });
      }
      if (cs?.qualification_warnings > 0) {
        findings.push({
          rule_code: 'TIMETABLE_QUALIFICATION_WARNING',
          category: 'TIMETABLE',
          severity: 'WARNING',
          title: 'Faculty subject qualification warnings',
          description: `${cs.qualification_warnings} assigned teaching period(s) have teachers lacking certified subject qualifications.`,
          entity_type: 'timetable_entries',
          entity_id: tt.published_version_id,
          remediation_guidance:
            'Verify teacher qualification certifications or log administrative qualification overrides.',
          blocking: false,
          validation_status: 'WARNING',
        });
      }
      if (conflictAnalysis.total_conflicts === 0) {
        findings.push({
          rule_code: 'TIMETABLE_COLLISION_FREE',
          category: 'TIMETABLE',
          severity: 'INFO',
          title: 'Timetable is verified conflict-free',
          description: '0 teacher, 0 section, and 0 classroom collisions detected.',
          entity_type: 'timetable_entries',
          entity_id: tt.published_version_id,
          remediation_guidance: 'None required.',
          blocking: false,
          validation_status: 'PASSED',
        });
      }
    }

    return this.buildCategoryResult('TIMETABLE', 'Timetable & Scheduling', findings);
  }

  private static validateClassroomsDomain(
    data: FullAcademicReadinessData,
    conflictAnalysis: any,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const cr = data.classroomConfig;

    if (cr.total_classrooms === 0) {
      findings.push({
        rule_code: 'NO_CLASSROOMS',
        category: 'CLASSROOMS',
        severity: 'WARNING',
        title: 'No physical classrooms configured',
        description: 'Zero physical rooms exist in classrooms table.',
        entity_type: 'classrooms',
        entity_id: null,
        remediation_guidance: 'Register physical facilities, classrooms, and laboratories.',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else {
      findings.push({
        rule_code: 'CLASSROOMS_CONFIGURED',
        category: 'CLASSROOMS',
        severity: 'INFO',
        title: 'Physical classrooms configured',
        description: `${cr.total_classrooms} classrooms registered (${cr.active_classrooms} active, ${cr.classrooms_with_capacity} with defined seating capacity).`,
        entity_type: 'classrooms',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    if (conflictAnalysis?.conflict_summary?.room_collisions > 0) {
      findings.push({
        rule_code: 'CLASSROOM_COLLISION_DETECTED',
        category: 'CLASSROOMS',
        severity: 'ERROR',
        title: 'Classroom facility collisions detected in timetable',
        description: `${conflictAnalysis.conflict_summary.room_collisions} room collision(s) detected where multiple classes occupy the same room simultaneously.`,
        entity_type: 'classrooms',
        entity_id: null,
        remediation_guidance: 'Reassign conflicting timetable entries to alternate classrooms.',
        blocking: true,
        validation_status: 'FAILED',
      });
    }

    return this.buildCategoryResult('CLASSROOMS', 'Physical Classrooms & Facilities', findings);
  }

  private static validateDigitalResourcesDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const res = data.resourceConfig;

    if (res.total_published_resources === 0) {
      findings.push({
        rule_code: 'NO_DIGITAL_RESOURCES',
        category: 'DIGITAL_RESOURCES',
        severity: 'WARNING',
        title: 'No published digital resources in library',
        description:
          'Zero published educational documents, worksheets, or multimedia exist in the digital library.',
        entity_type: 'learning_resources',
        entity_id: null,
        remediation_guidance:
          'Upload instructional worksheets, documents, and reference materials.',
        blocking: false,
        validation_status: 'WARNING',
      });
    } else {
      findings.push({
        rule_code: 'DIGITAL_RESOURCES_AVAILABLE',
        category: 'DIGITAL_RESOURCES',
        severity: 'INFO',
        title: 'Digital learning resources available',
        description: `${res.total_published_resources} published learning resources available in institutional repository.`,
        entity_type: 'learning_resources',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    return this.buildCategoryResult('DIGITAL_RESOURCES', 'Digital Resource Library', findings);
  }

  private static validateLessonPlanningDomain(
    data: FullAcademicReadinessData,
  ): CategoryReadinessResult {
    const findings: ValidationFinding[] = [];
    const lp = data.lessonPlanConfig;

    if (lp.total_lesson_plans === 0) {
      findings.push({
        rule_code: 'NO_SAVED_LESSON_PLANS',
        category: 'LESSON_PLANNING',
        severity: 'INFO',
        title: 'No saved instructional lesson plans found',
        description:
          'No saved lesson plans registered for curriculum units in this academic session.',
        entity_type: 'lesson_plans',
        entity_id: null,
        remediation_guidance:
          'Teachers can generate and save structured lesson plans via AI Lesson Planning.',
        blocking: false,
        validation_status: 'PASSED',
      });
    } else {
      findings.push({
        rule_code: 'LESSON_PLANS_AVAILABLE',
        category: 'LESSON_PLANNING',
        severity: 'INFO',
        title: 'Instructional lesson plans available',
        description: `${lp.total_lesson_plans} saved lesson plans (${lp.active_lesson_plans} active) with ${lp.total_activities_count} activities across ${lp.units_with_lessons_count} syllabus units.`,
        entity_type: 'lesson_plans',
        entity_id: null,
        remediation_guidance: 'None required.',
        blocking: false,
        validation_status: 'PASSED',
      });
    }

    return this.buildCategoryResult(
      'LESSON_PLANNING',
      'AI Lesson Planning & Instructional Preparation',
      findings,
    );
  }

  private static buildCategoryResult(
    category: ValidationCategory,
    displayName: string,
    findings: ValidationFinding[],
  ): CategoryReadinessResult {
    const passedCount = findings.filter((f) => f.validation_status === 'PASSED').length;
    const failedCount = findings.filter((f) => f.validation_status === 'FAILED').length;
    const warningsCount = findings.filter((f) => f.validation_status === 'WARNING').length;
    const unsupportedCount = findings.filter((f) => f.validation_status === 'UNSUPPORTED').length;
    const totalChecks = findings.length;

    const evaluable = passedCount + failedCount + warningsCount;
    let score = 0;
    if (evaluable > 0) {
      score = Math.round(((passedCount + 0.5 * warningsCount) / evaluable) * 100);
    } else if (unsupportedCount > 0) {
      score = 0;
    }

    let status: ValidationCategoryResult['status'] = 'PASSED';
    if (failedCount > 0) {
      status = 'FAILED';
    } else if (warningsCount > 0) {
      status = 'WARNING';
    } else if (unsupportedCount === totalChecks) {
      status = 'UNSUPPORTED';
    }

    return {
      category,
      display_name: displayName,
      status,
      score,
      checks_count: totalChecks,
      passed_count: passedCount,
      failed_count: failedCount,
      warnings_count: warningsCount,
      unsupported_count: unsupportedCount,
      findings,
    };
  }
}
type ValidationCategoryResult = CategoryReadinessResult;
