import { Router, Request, Response } from 'express';
import prisma from '../../../lib/prismaClient';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { AcademicYearController } from '../controllers/academic-year.controller';
import { GradeController } from '../controllers/grade.controller';
import { SectionController } from '../controllers/section.controller';
import { AcademicYearGradeController } from '../controllers/academic-year-grade.controller';
import { AcademicDashboardController } from '../controllers/academic-dashboard.controller';
import { BoardController } from '../controllers/board.controller';
import { LearningResourceController } from '../controllers/learning-resource.controller';
import { CurriculumController } from '../controllers/curriculum.controller';
import { SubjectController } from '../controllers/subject.controller';
import { SyllabusController } from '../controllers/syllabus.controller';
import { AcademicCalendarController } from '../controllers/academic-calendar.controller';
import { AcademicTermController } from '../controllers/academic-term.controller';
import { TimetableController } from '../controllers/timetable.controller';
import { FacultyWorkloadController } from '../controllers/faculty-workload.controller';
import { TimetableConflictController } from '../controllers/timetable-conflict.controller';
import { LessonPlanningController } from '../controllers/lesson-planning.controller';
import { AcademicReadinessController } from '../controllers/readiness.controller';
import { TeacherContextController } from '../controllers/teacher-context.controller';
import { SuperAdminController } from '../controllers/super-admin.controller';
import { AcademicPolicy } from '../policies/academic.policy';
import { ResponseHelper } from '../utils/response.helper';
import { uploadSingleMiddleware } from '../../../middlewares/upload.middleware';

const isUuidStr = (str?: string) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const academicRouter = Router();

// ============================================================================
// MODULE 6: ACADEMIC CONFIGURATION OVERVIEW & DASHBOARD
// ============================================================================
academicRouter.get(
  '/overview',
  checkPermission(AcademicPolicy.canView()),
  AcademicDashboardController.getOverview,
);

academicRouter.get(
  '/dashboard',
  checkPermission(AcademicPolicy.canView()),
  AcademicDashboardController.getOverview,
);

academicRouter.get(
  '/years/:id/structure',
  checkPermission(AcademicPolicy.canView()),
  AcademicDashboardController.getStructureTree,
);

// ============================================================================
// PHASE 3: EDUCATION BOARD & FRAMEWORK MANAGEMENT (STAGE-1 COMPLIANT)
// ============================================================================
academicRouter.get(
  '/boards',
  checkPermission(AcademicPolicy.canView()),
  BoardController.getOverview,
);

academicRouter.patch(
  '/boards/affiliation',
  checkPermission(AcademicPolicy.canUpdate()),
  BoardController.updateAffiliation,
);

academicRouter.get(
  '/boards/:boardCode/grades',
  checkPermission(AcademicPolicy.canView()),
  BoardController.getGradesByBoard,
);

// Explicit 501 Handlers for Unsupported Features (prevents silent RAM fallback)
academicRouter.get(
  '/frameworks',
  checkPermission(AcademicPolicy.canView()),
  BoardController.handleFrameworksUnsupported,
);

academicRouter.post(
  '/frameworks',
  checkPermission(AcademicPolicy.canCreate()),
  BoardController.handleFrameworksUnsupported,
);

// ============================================================================
// PHASE 5: CURRICULUM, SYLLABUS, SUBJECTS, CALENDAR & TERMS MANAGEMENT
// ============================================================================

// Curriculum Management
academicRouter.get(
  '/curriculum/overview',
  checkPermission(AcademicPolicy.canView()),
  CurriculumController.getOverview,
);

academicRouter.get(
  '/curriculum',
  checkPermission(AcademicPolicy.canView()),
  CurriculumController.list,
);

academicRouter.get(
  '/curriculum/:id',
  checkPermission(AcademicPolicy.canView()),
  CurriculumController.getById,
);

academicRouter.patch(
  '/curriculum/:id/status',
  checkPermission(AcademicPolicy.canUpdate()),
  CurriculumController.updateStatus,
);

academicRouter.patch(
  '/curriculum/:id',
  checkPermission(AcademicPolicy.canUpdate()),
  CurriculumController.updatePlan,
);

// Subject Management & Offerings
academicRouter.get(
  '/subjects/categories',
  checkPermission(AcademicPolicy.canView()),
  SubjectController.listCategories,
);

academicRouter.get('/subjects', checkPermission(AcademicPolicy.canView()), SubjectController.list);

academicRouter.get(
  '/subjects/:id',
  checkPermission(AcademicPolicy.canView()),
  SubjectController.getById,
);

academicRouter.get(
  '/subjects/:id/resources',
  checkPermission(AcademicPolicy.canView()),
  SubjectController.getResources,
);

academicRouter.post(
  '/subjects',
  checkPermission(AcademicPolicy.canCreate()),
  SubjectController.createUnsupported,
);

academicRouter.get(
  '/classes/:id/subjects',
  checkPermission(AcademicPolicy.canView()),
  SubjectController.getGradeSubjects,
);

// Syllabus Management
academicRouter.get('/syllabus', checkPermission(AcademicPolicy.canView()), SyllabusController.list);

academicRouter.get(
  '/syllabus/:id',
  checkPermission(AcademicPolicy.canView()),
  SyllabusController.getById,
);

academicRouter.get(
  '/syllabus/:id/coverage',
  checkPermission(AcademicPolicy.canView()),
  SyllabusController.getCoverage,
);

academicRouter.post(
  '/syllabus/:id/coverage',
  checkPermission(AcademicPolicy.canUpdate()),
  SyllabusController.logCoverageUnsupported,
);

// Academic Calendar Management
academicRouter.get(
  '/calendar/events/:id',
  checkPermission(AcademicPolicy.canView()),
  AcademicCalendarController.getEntryById,
);

academicRouter.get(
  '/calendar/events',
  checkPermission(AcademicPolicy.canView()),
  AcademicCalendarController.listEntries,
);

academicRouter.get(
  '/calendar',
  checkPermission(AcademicPolicy.canView()),
  AcademicCalendarController.getCalendar,
);

// Term Management
academicRouter.get(
  '/terms',
  checkPermission(AcademicPolicy.canView()),
  AcademicTermController.list,
);

academicRouter.get(
  '/terms/:id',
  checkPermission(AcademicPolicy.canView()),
  AcademicTermController.getById,
);

// ============================================================================
// PHASE 6: TIMETABLE, FACULTY SCHEDULING & WORKLOAD OPTIMIZATION
// ============================================================================

// Timetable Overview & Management
academicRouter.get(
  '/timetables/overview',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.getOverview,
);

academicRouter.get(
  '/timetables',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.list,
);

academicRouter.get(
  '/timetables/:id',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.getById,
);

academicRouter.get(
  '/timetables/:id/conflicts',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableConflictController.getConflicts,
);

// Class, Section & Teacher Timetables
academicRouter.get(
  '/sections/:id/timetable',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.getSectionTimetable,
);

academicRouter.get(
  '/classes/:id/timetable',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.getClassTimetable,
);

academicRouter.get(
  '/teachers/:id/timetable',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.getTeacherTimetable,
);

// Faculty Workload Optimization
academicRouter.get(
  '/faculty-workload',
  checkPermission(AcademicPolicy.canView()),
  FacultyWorkloadController.list,
);

academicRouter.get(
  '/faculty-workload/:id',
  checkPermission(AcademicPolicy.canView()),
  FacultyWorkloadController.getById,
);

// Classrooms & Room Schedules
academicRouter.get(
  '/classrooms',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.listClassrooms,
);

academicRouter.get(
  '/classrooms/:id/schedule',
  checkPermission(AcademicPolicy.canViewTimetable()),
  TimetableController.getClassroomSchedule,
);

// Guarded Timetable Write Operations (HTTP 501 Unsupported)
academicRouter.post(
  '/timetables',
  checkPermission(AcademicPolicy.canManageTimetable()),
  TimetableController.createUnsupported,
);

academicRouter.patch(
  '/timetables/:id',
  checkPermission(AcademicPolicy.canManageTimetable()),
  TimetableController.updateUnsupported,
);

academicRouter.post(
  '/timetables/:id/entries',
  checkPermission(AcademicPolicy.canManageTimetable()),
  TimetableController.entryMutationUnsupported,
);

academicRouter.patch(
  '/timetables/:id/entries/:entryId',
  checkPermission(AcademicPolicy.canManageTimetable()),
  TimetableController.entryMutationUnsupported,
);

academicRouter.delete(
  '/timetables/:id/entries/:entryId',
  checkPermission(AcademicPolicy.canManageTimetable()),
  TimetableController.entryMutationUnsupported,
);

academicRouter.post(
  '/timetables/:id/publish',
  checkPermission(AcademicPolicy.canManageTimetable()),
  TimetableController.publishUnsupported,
);

// ============================================================================
// PHASE 7: AI-POWERED LESSON PLANNING & TEACHING ASSISTANCE
// ============================================================================

// Context Resolution & Retrieval Endpoints
academicRouter.get(
  '/lesson-planning/curriculum',
  checkPermission(AcademicPolicy.canViewLessonPlan()),
  LessonPlanningController.getCurriculum,
);

academicRouter.get(
  '/lesson-planning/units',
  checkPermission(AcademicPolicy.canViewLessonPlan()),
  LessonPlanningController.getUnits,
);

academicRouter.get(
  '/lesson-planning/outcomes',
  checkPermission(AcademicPolicy.canViewLessonPlan()),
  LessonPlanningController.getOutcomes,
);

academicRouter.get(
  '/lesson-planning/resources',
  checkPermission(AcademicPolicy.canViewLessonPlan()),
  LessonPlanningController.getResources,
);

// AI Generation, Refinement & Quality Validation Endpoints
academicRouter.post(
  '/lesson-planning/generate',
  checkPermission(AcademicPolicy.canGenerateLessonPlan()),
  LessonPlanningController.generate,
);

academicRouter.post(
  '/lesson-planning/refine',
  checkPermission(AcademicPolicy.canGenerateLessonPlan()),
  LessonPlanningController.refine,
);

academicRouter.post(
  '/lesson-planning/validate',
  checkPermission(AcademicPolicy.canViewLessonPlan()),
  LessonPlanningController.validate,
);

// Saved Lesson Plans (Physical PostgreSQL Read-Only & Guarded Writes)
academicRouter.get(
  '/lesson-planning/plans',
  checkPermission(AcademicPolicy.canViewLessonPlan()),
  LessonPlanningController.listPlans,
);

academicRouter.get(
  '/lesson-planning/plans/:id',
  checkPermission(AcademicPolicy.canViewLessonPlan()),
  LessonPlanningController.getPlanById,
);

academicRouter.post(
  '/lesson-planning/plans',
  checkPermission(AcademicPolicy.canManageLessonPlan()),
  LessonPlanningController.createPlanUnsupported,
);

academicRouter.patch(
  '/lesson-planning/plans/:id',
  checkPermission(AcademicPolicy.canManageLessonPlan()),
  LessonPlanningController.updatePlanUnsupported,
);

academicRouter.delete(
  '/lesson-planning/plans/:id',
  checkPermission(AcademicPolicy.canManageLessonPlan()),
  LessonPlanningController.deletePlanUnsupported,
);

academicRouter.post(
  '/lesson-planning/plans/:id/submit',
  checkPermission(AcademicPolicy.canManageLessonPlan()),
  LessonPlanningController.submitPlanUnsupported,
);

academicRouter.post(
  '/lesson-planning/plans/:id/approve',
  checkPermission(AcademicPolicy.canManageLessonPlan()),
  LessonPlanningController.approvePlanUnsupported,
);

// ============================================================================
// PHASE 8: ACADEMIC SETUP VALIDATION & PUBLISHING READINESS
// ============================================================================
academicRouter.get(
  '/readiness/overview',
  checkPermission(AcademicPolicy.canViewReadiness()),
  AcademicReadinessController.getOverview,
);

academicRouter.get(
  '/readiness/:academicYearId',
  checkPermission(AcademicPolicy.canViewReadiness()),
  AcademicReadinessController.getYearReadiness,
);

academicRouter.get(
  '/readiness/:academicYearId/categories',
  checkPermission(AcademicPolicy.canViewReadiness()),
  AcademicReadinessController.getCategories,
);

academicRouter.get(
  '/readiness/:academicYearId/findings',
  checkPermission(AcademicPolicy.canViewReadiness()),
  AcademicReadinessController.getFindings,
);

academicRouter.post(
  '/readiness/:academicYearId/validate',
  checkPermission(AcademicPolicy.canViewReadiness()),
  AcademicReadinessController.validate,
);

academicRouter.get(
  '/readiness/:academicYearId/dependencies',
  checkPermission(AcademicPolicy.canViewReadiness()),
  AcademicReadinessController.getDependencies,
);

academicRouter.post(
  '/readiness/:academicYearId/publish',
  checkPermission(AcademicPolicy.canPublishAcademic()),
  AcademicReadinessController.publishUnsupported,
);

// ============================================================================
// PHASE 4: DIGITAL RESOURCE LIBRARY (POSTGRESQL & SUPABASE STORAGE BACKED)
// ============================================================================
academicRouter.get(
  '/resources',
  checkPermission(AcademicPolicy.canView()),
  LearningResourceController.list,
);

academicRouter.get(
  '/resources/categories',
  checkPermission(AcademicPolicy.canView()),
  LearningResourceController.listCategories,
);

academicRouter.get(
  '/resources/:id',
  checkPermission(AcademicPolicy.canView()),
  LearningResourceController.getById,
);

academicRouter.post(
  '/resources',
  checkPermission(AcademicPolicy.canCreate()),
  uploadSingleMiddleware,
  LearningResourceController.create,
);

academicRouter.patch(
  '/resources/:id',
  checkPermission(AcademicPolicy.canUpdate()),
  LearningResourceController.update,
);

academicRouter.post(
  '/resources/:id/archive',
  checkPermission(AcademicPolicy.canUpdate()),
  LearningResourceController.archive,
);

academicRouter.delete(
  '/resources/:id',
  checkPermission(AcademicPolicy.canDelete()),
  LearningResourceController.delete,
);

academicRouter.get(
  '/resources/:id/preview',
  checkPermission(AcademicPolicy.canView()),
  LearningResourceController.preview,
);

academicRouter.get(
  '/resources/:id/download',
  checkPermission(AcademicPolicy.canView()),
  LearningResourceController.download,
);

// Explicit 501 Handlers for Unsupported Associations
academicRouter.post(
  '/resources/:id/subjects',
  checkPermission(AcademicPolicy.canCreate()),
  LearningResourceController.handleSubjectMappingUnsupported,
);

academicRouter.post(
  '/resources/:id/frameworks',
  checkPermission(AcademicPolicy.canCreate()),
  LearningResourceController.handleFrameworkMappingUnsupported,
);

// ============================================================================
// MODULE 1: ACADEMIC YEAR MANAGEMENT
// ============================================================================
academicRouter.get(
  '/years/current',
  checkPermission(AcademicPolicy.canView()),
  AcademicYearController.getCurrent,
);

academicRouter.post(
  '/years',
  checkPermission(AcademicPolicy.canCreate()),
  checkIdempotency,
  AcademicYearController.create,
);

academicRouter.get(
  '/years',
  checkPermission(AcademicPolicy.canView()),
  AcademicYearController.getAll,
);

academicRouter.get(
  '/years/:id',
  checkPermission(AcademicPolicy.canView()),
  AcademicYearController.getById,
);

academicRouter.patch(
  '/years/:id',
  checkPermission(AcademicPolicy.canUpdate()),
  AcademicYearController.update,
);

academicRouter.post(
  '/years/:id/set-current',
  checkPermission(AcademicPolicy.canUpdate()),
  AcademicYearController.setCurrent,
);

academicRouter.post(
  '/years/:id/archive',
  checkPermission(AcademicPolicy.canUpdate()),
  AcademicYearController.archive,
);

// ============================================================================
// MODULE 2: GRADE MANAGEMENT
// ============================================================================
academicRouter.post(
  '/grades',
  checkPermission(AcademicPolicy.canCreate()),
  checkIdempotency,
  GradeController.create,
);

academicRouter.get('/grades', checkPermission(AcademicPolicy.canView()), GradeController.getAll);

academicRouter.get(
  '/grades/:id',
  checkPermission(AcademicPolicy.canView()),
  GradeController.getById,
);

academicRouter.patch(
  '/grades/:id',
  checkPermission(AcademicPolicy.canUpdate()),
  GradeController.update,
);

// ============================================================================
// MODULE 3: ACADEMIC YEAR GRADE MAPPING
// ============================================================================
academicRouter.get(
  '/years/:academicYearId/grades',
  checkPermission(AcademicPolicy.canView()),
  AcademicYearGradeController.getByAcademicYear,
);

academicRouter.post(
  '/years/:academicYearId/grades',
  checkPermission(AcademicPolicy.canCreate()),
  checkIdempotency,
  AcademicYearGradeController.create,
);

academicRouter.post(
  '/year-grades',
  checkPermission(AcademicPolicy.canCreate()),
  checkIdempotency,
  AcademicYearGradeController.create,
);

academicRouter.get(
  '/year-grades/by-year/:academicYearId',
  checkPermission(AcademicPolicy.canView()),
  AcademicYearGradeController.getByAcademicYear,
);

academicRouter.get(
  '/year-grades/:id',
  checkPermission(AcademicPolicy.canView()),
  AcademicYearGradeController.getById,
);

academicRouter.patch(
  '/year-grades/:id',
  checkPermission(AcademicPolicy.canUpdate()),
  AcademicYearGradeController.update,
);

academicRouter.delete(
  '/year-grades/:id',
  checkPermission(AcademicPolicy.canDelete()),
  AcademicYearGradeController.delete,
);

// ============================================================================
// MODULE 4: SECTION MANAGEMENT & MODULE 5: CLASS TEACHER ASSIGNMENT
// ============================================================================
academicRouter.patch(
  '/sections/:id/class-teacher',
  checkPermission(AcademicPolicy.canAssignFaculty()),
  SectionController.assignClassTeacher,
);

academicRouter.get(
  '/sections',
  checkPermission(AcademicPolicy.canView()),
  SectionController.getAll,
);

academicRouter.post(
  '/sections',
  checkPermission(AcademicPolicy.canCreate()),
  checkIdempotency,
  SectionController.create,
);

academicRouter.get(
  '/sections/by-year-grade/:academicYearGradeId',
  checkPermission(AcademicPolicy.canView()),
  SectionController.getByAcademicYearGrade,
);

academicRouter.get(
  '/sections/:id',
  checkPermission(AcademicPolicy.canView()),
  SectionController.getById,
);

academicRouter.patch(
  '/sections/:id',
  checkPermission(AcademicPolicy.canUpdate()),
  SectionController.update,
);

academicRouter.delete(
  '/sections/:id',
  checkPermission(AcademicPolicy.canDelete()),
  SectionController.delete,
);

// ============================================================================
// UI BACKWARD COMPATIBILITY: CLASSES DROPDOWN (STRICTLY TENANT-SCOPED)
// ============================================================================
academicRouter.get(
  '/classes',
  checkPermission(AcademicPolicy.canView()),
  async (req: Request, res: Response) => {
    try {
      // Authoritative tenant scoping: NEVER trust client query parameter for cross-tenant access
      const targetOrgId =
        req.context?.user?.org_id || req.context?.user?.school_id || (req as any).tenantOrgId;
      if (!targetOrgId) {
        return ResponseHelper.sendError(res, 'Tenant context is required', 401, 'UNAUTHORIZED');
      }

      const { academic_year_id } = req.query;
      let targetYearId = isUuidStr(academic_year_id as string) ? (academic_year_id as string) : '';
      if (!targetYearId) {
        const activeYear = await prisma.academic_years.findFirst({
          where: { org_id: targetOrgId },
          orderBy: { start_date: 'desc' },
        });
        targetYearId = activeYear?.academic_year_id || '';
      }

      let aygList: any[] = [];
      if (targetYearId && isUuidStr(targetYearId)) {
        aygList = await prisma.academic_year_grades.findMany({
          where: {
            academic_year_id: targetYearId,
            academic_years: { org_id: targetOrgId },
            is_active: true,
          },
          include: {
            grades: true,
            sections: {
              where: { is_active: true },
              orderBy: { section_name: 'asc' },
            },
          },
          orderBy: {
            grades: { display_order: 'asc' },
          },
        });
      }

      if (aygList.length === 0) {
        const grades = await prisma.grades.findMany({
          where: { org_id: targetOrgId, is_active: true },
          orderBy: { display_order: 'asc' },
        });

        const seenGrades = new Set<string>();
        const uniqueGrades: any[] = [];
        for (const g of grades) {
          const key = `${g.grade_name}_${g.board || ''}`;
          if (!seenGrades.has(key)) {
            seenGrades.add(key);
            uniqueGrades.push(g);
          }
        }

        return res.json(
          uniqueGrades.map((g) => ({
            id: g.grade_id,
            class_id: g.grade_id,
            grade_id: g.grade_id,
            academic_year_grade_id: g.grade_id,
            name: g.grade_name,
            grade_name: g.grade_name,
            board: g.board ?? null,
            code: g.grade_code,
            display_order: g.display_order,
            school_id: targetOrgId,
            academic_year_id: targetYearId || null,
            sections: [],
          })),
        );
      }

      const seenAygKeys = new Set<string>();
      const uniqueAygList: any[] = [];
      for (const ayg of aygList) {
        const gName = ayg.grades?.grade_name || ayg.grade_id;
        const key = `${gName}_${ayg.grades?.board || ''}_${ayg.academic_year_id}`;
        if (!seenAygKeys.has(key)) {
          seenAygKeys.add(key);
          uniqueAygList.push(ayg);
        }
      }

      return res.json(
        uniqueAygList.map((ayg) => ({
          id: ayg.academic_year_grade_id,
          class_id: ayg.academic_year_grade_id,
          academic_year_grade_id: ayg.academic_year_grade_id,
          grade_id: ayg.grade_id,
          name: ayg.grades?.grade_name || '',
          grade_name: ayg.grades?.grade_name || '',
          board: ayg.grades?.board ?? null,
          code: ayg.grades?.grade_code || '',
          display_order: ayg.grades?.display_order || 1,
          school_id: targetOrgId,
          academic_year_id: ayg.academic_year_id,
          sections: (ayg.sections || []).map((s: any) => ({
            id: s.section_id,
            section_id: s.section_id,
            name: s.section_name,
            section_name: s.section_name,
            capacity: s.capacity,
            room_no: s.room_no,
            academic_year_grade_id: s.academic_year_grade_id,
          })),
        })),
      );
    } catch (error: any) {
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  },
);

// ============================================================================
// PHASE 9: TEACHER WORKSPACE & ROLE-BASED SEGREGATION
// ============================================================================
academicRouter.get(
  '/teacher/dashboard',
  checkPermission(AcademicPolicy.canAccessTeacherWorkspace()),
  TeacherContextController.getDashboard,
);

academicRouter.get(
  '/teacher/classes',
  checkPermission(AcademicPolicy.canAccessTeacherWorkspace()),
  TeacherContextController.getClasses,
);

academicRouter.get(
  '/teacher/subjects',
  checkPermission(AcademicPolicy.canAccessTeacherWorkspace()),
  TeacherContextController.getSubjects,
);

academicRouter.get(
  '/teacher/timetable',
  checkPermission(AcademicPolicy.canAccessTeacherWorkspace()),
  TeacherContextController.getTimetable,
);

academicRouter.get(
  '/teacher/curriculum',
  checkPermission(AcademicPolicy.canAccessTeacherWorkspace()),
  TeacherContextController.getCurriculum,
);

academicRouter.get(
  '/teacher/lesson-plans',
  checkPermission(AcademicPolicy.canAccessTeacherWorkspace()),
  TeacherContextController.getLessonPlans,
);

academicRouter.get(
  '/teacher/workload',
  checkPermission(AcademicPolicy.canAccessTeacherWorkspace()),
  TeacherContextController.getWorkload,
);

// ============================================================================
// PHASE 9: SUPER ADMIN ACADEMIC OVERSIGHT
// ============================================================================
academicRouter.get('/superadmin/overview', SuperAdminController.getAcademicOverview);
