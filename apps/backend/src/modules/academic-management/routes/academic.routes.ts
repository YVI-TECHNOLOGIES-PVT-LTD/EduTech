import { Router } from 'express';
import prisma from '../../../lib/prismaClient';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { AcademicYearController } from '../controllers/academic-year.controller';
import { GradeController } from '../controllers/grade.controller';
import { SectionController } from '../controllers/section.controller';
import { AcademicYearGradeController } from '../controllers/academic-year-grade.controller';
import { AcademicDashboardController } from '../controllers/academic-dashboard.controller';
import { AcademicPolicy } from '../policies/academic.policy';

const isUuidStr = (str?: string) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const academicRouter = Router();

// Dashboard & Structure Tree
academicRouter.get(
  '/dashboard',
  checkPermission(AcademicPolicy.canView()),
  AcademicDashboardController.getDashboard,
);
academicRouter.get(
  '/years/:id/structure',
  checkPermission(AcademicPolicy.canView()),
  AcademicDashboardController.getStructureTree,
);

// Academic Years CRUD
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

// Grades CRUD
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

// Classes (Grades with sections master data for UI dropdowns)
academicRouter.get('/classes', async (req, res) => {
  try {
    let targetOrgId = (req.query.school_id ||
      req.query.org_id ||
      (req as any).tenantOrgId ||
      (req as any).user?.org_id ||
      (req as any).user?.school_id ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id) as string;

    if (!targetOrgId || targetOrgId === 'school-main' || targetOrgId === 'org-main') {
      const activeOrg =
        (await prisma.organizations.findFirst({ where: { status: 'active' } })) ||
        (await prisma.organizations.findFirst());
      if (activeOrg) targetOrgId = activeOrg.org_id;
    }

    const { academic_year_id } = req.query;
    let targetYearId = isUuidStr(academic_year_id as string) ? (academic_year_id as string) : '';
    if (!targetYearId && targetOrgId && isUuidStr(targetOrgId)) {
      const activeYear = await prisma.academic_years.findFirst({
        where: { org_id: targetOrgId },
        orderBy: { created_at: 'desc' },
      });
      targetYearId = activeYear?.academic_year_id || '';
    }

    let aygList: any[] = [];
    if (targetYearId && isUuidStr(targetYearId)) {
      aygList = await prisma.academic_year_grades.findMany({
        where: {
          academic_year_id: targetYearId,
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

    if (aygList.length === 0 && targetOrgId && isUuidStr(targetOrgId)) {
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
          board: g.board || 'CBSE',
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
        name: ayg.grades?.grade_name || 'Class',
        grade_name: ayg.grades?.grade_name || 'Class',
        board: ayg.grades?.board || 'CBSE',
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
    return res.status(500).json({ error: error.message });
  }
});

// Sections CRUD
academicRouter.get('/sections', async (req, res) => {
  try {
    const classId = (req.query.class_id ||
      req.query.classId ||
      req.query.academic_year_grade_id) as string;
    let targetOrgId = (req.query.school_id ||
      req.query.org_id ||
      (req as any).tenantOrgId ||
      (req as any).user?.org_id ||
      (req as any).user?.school_id ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id) as string;

    const whereClause: any = { is_active: true };

    if (classId && isUuidStr(classId)) {
      whereClause.OR = [
        { academic_year_grade_id: classId },
        { academic_year_grades: { grade_id: classId } },
      ];
    } else if (targetOrgId && isUuidStr(targetOrgId)) {
      whereClause.academic_year_grades = {
        academic_years: {
          org_id: targetOrgId,
        },
      };
    }

    const sections = await prisma.sections.findMany({
      where: whereClause,
      include: {
        academic_year_grades: {
          include: { grades: true, academic_years: true },
        },
        staff: {
          include: { users_staff_user_idTousers: true },
        },
      },
      orderBy: { section_name: 'asc' },
    });

    return res.json(
      sections.map((s) => ({
        id: s.section_id,
        section_id: s.section_id,
        name: s.section_name,
        section_name: s.section_name,
        capacity: s.capacity,
        room_no: s.room_no,
        academic_year_grade_id: s.academic_year_grade_id,
        class_teacher_id: s.class_teacher_id,
        class: s.academic_year_grades?.grades
          ? {
              id: s.academic_year_grades.grades.grade_id,
              name: s.academic_year_grades.grades.grade_name,
            }
          : undefined,
      })),
    );
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

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

// Academic Year Grades Mapping CRUD
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
