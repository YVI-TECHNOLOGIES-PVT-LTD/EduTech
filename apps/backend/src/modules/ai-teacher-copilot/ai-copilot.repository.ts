import { Prisma } from '@prisma/client';
import prisma from '../../lib/prismaClient';
import { TeacherAcademicContextDto } from './ai-copilot.types';

export class AiCopilotRepository {
  /**
   * Resolve teacher staff profile and active assigned sections/subjects for a user.
   */
  static async getTeacherAcademicContext(
    orgId: string,
    userId: string,
  ): Promise<TeacherAcademicContextDto | null> {
    const staffRows = await prisma.$queryRaw<
      Array<{
        staff_id: string;
        user_id: string;
        org_id: string;
        org_name: string;
        teacher_name: string;
      }>
    >(Prisma.sql`
      SELECT s.staff_id::text, s.user_id::text, s.org_id::text, o.org_name,
             TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS teacher_name
      FROM public.staff s
      JOIN public.organizations o ON o.org_id = s.org_id
      JOIN public.users u ON u.user_id = s.user_id
      WHERE s.org_id = ${orgId}::uuid
        AND s.user_id = ${userId}::uuid
        AND s.is_active = TRUE
      LIMIT 1
    `);

    if (!staffRows || staffRows.length === 0) {
      return null;
    }
    const staff = staffRows[0];

    const currentYearRows = await prisma.$queryRaw<
      Array<{ academic_year_id: string; academic_year_name: string; status: string }>
    >(Prisma.sql`
      SELECT academic_year_id::text, academic_year_name, status::text
      FROM public.academic_years
      WHERE org_id = ${orgId}::uuid
        AND status IN ('open', 'teaching')
      ORDER BY start_date DESC
      LIMIT 1
    `);
    const academicYear = currentYearRows[0] || null;

    const assignedSections = await prisma.$queryRaw<
      Array<{
        faculty_assignment_id: string;
        section_id: string;
        section_name: string;
        grade_id: string;
        grade_name: string;
        grade_code: string;
        academic_year_grade_subject_id: string;
        subject_id: string;
        subject_name: string;
        subject_code: string;
        curriculum_plan_id: string | null;
        curriculum_plan_title: string | null;
      }>
    >(Prisma.sql`
      SELECT
        fa.faculty_assignment_id::text,
        s.section_id::text,
        s.section_name,
        g.grade_id::text,
        g.grade_name,
        g.grade_code,
        aygs.academic_year_grade_subject_id::text,
        sub.subject_id::text,
        sub.subject_name,
        sub.subject_code,
        cp.curriculum_plan_id::text,
        cp.plan_title AS curriculum_plan_title
      FROM public.section_subject_faculty_assignments fa
      JOIN public.sections s ON s.section_id = fa.section_id
      JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
      JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN public.grades g ON g.grade_id = ayg.grade_id
      JOIN public.academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = fa.academic_year_grade_subject_id
      JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
      LEFT JOIN public.curriculum_plans cp
        ON cp.academic_year_grade_subject_id = aygs.academic_year_grade_subject_id
       AND cp.status = 'published'
       AND cp.org_id = ${orgId}::uuid
      WHERE fa.staff_id = ${staff.staff_id}::uuid
        AND ay.org_id = ${orgId}::uuid
        AND fa.is_active = TRUE
      ORDER BY g.display_order ASC, s.section_name ASC, sub.subject_name ASC
    `);

    return {
      staff_id: staff.staff_id,
      user_id: staff.user_id,
      teacher_name: staff.teacher_name,
      org_id: staff.org_id,
      org_name: staff.org_name,
      academic_year: academicYear,
      assigned_sections: assignedSections,
    };
  }

  /**
   * Verify and fetch faculty assignment details scoped to teacher and org.
   */
  static async getFacultyAssignmentScoped(
    orgId: string,
    staffId: string,
    facultyAssignmentId: string,
  ) {
    const rows = await prisma.$queryRaw<
      Array<{
        faculty_assignment_id: string;
        section_id: string;
        section_name: string;
        grade_id: string;
        grade_name: string;
        academic_year_grade_subject_id: string;
        subject_name: string;
        curriculum_plan_id: string | null;
        curriculum_plan_title: string | null;
      }>
    >(Prisma.sql`
      SELECT
        fa.faculty_assignment_id::text,
        s.section_id::text,
        s.section_name,
        g.grade_id::text,
        g.grade_name,
        aygs.academic_year_grade_subject_id::text,
        sub.subject_name,
        cp.curriculum_plan_id::text,
        cp.plan_title AS curriculum_plan_title
      FROM public.section_subject_faculty_assignments fa
      JOIN public.sections s ON s.section_id = fa.section_id
      JOIN public.academic_year_grades ayg ON ayg.academic_year_grade_id = s.academic_year_grade_id
      JOIN public.academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      JOIN public.grades g ON g.grade_id = ayg.grade_id
      JOIN public.academic_year_grade_subjects aygs ON aygs.academic_year_grade_subject_id = fa.academic_year_grade_subject_id
      JOIN public.subjects sub ON sub.subject_id = aygs.subject_id
      LEFT JOIN public.curriculum_plans cp
        ON cp.academic_year_grade_subject_id = aygs.academic_year_grade_subject_id
       AND cp.status = 'published'
       AND cp.org_id = ${orgId}::uuid
      WHERE fa.faculty_assignment_id = ${facultyAssignmentId}::uuid
        AND fa.staff_id = ${staffId}::uuid
        AND ay.org_id = ${orgId}::uuid
        AND fa.is_active = TRUE
      LIMIT 1
    `);

    return rows[0] || null;
  }

  /**
   * Fetch curriculum units and learning outcomes for a subject/curriculum plan.
   */
  static async getCurriculumUnits(curriculumPlanId: string) {
    return prisma.$queryRaw<
      Array<{
        curriculum_unit_id: string;
        unit_code: string;
        unit_title: string;
        planned_duration_periods: number;
        learning_outcomes: string[];
      }>
    >(Prisma.sql`
      SELECT
        u.curriculum_unit_id::text,
        u.unit_code,
        u.unit_title,
        COALESCE(u.planned_duration_periods, 4)::int AS planned_duration_periods,
        COALESCE(
          json_agg(lo.outcome_statement) FILTER (WHERE lo.outcome_statement IS NOT NULL),
          '[]'::json
        ) AS learning_outcomes
      FROM public.curriculum_plan_units u
      LEFT JOIN public.curriculum_learning_outcomes lo ON lo.curriculum_unit_id = u.curriculum_unit_id
      WHERE u.curriculum_plan_id = ${curriculumPlanId}::uuid
      GROUP BY u.curriculum_unit_id, u.unit_code, u.unit_title, u.planned_duration_periods, u.sequence_number
      ORDER BY u.sequence_number ASC
    `);
  }

  /**
   * Fetch existing student performance aggregates in section for topic analysis.
   */
  static async getSectionPerformanceSnapshot(orgId: string, sectionId: string) {
    const students = await prisma.$queryRaw<
      Array<{
        student_id: string;
        admission_no: string;
        student_name: string;
        attendance_rate: number;
        submission_count: number;
        average_marks: number | null;
      }>
    >(Prisma.sql`
      SELECT
        st.student_id::text,
        st.admission_no,
        TRIM(CONCAT(st.first_name, ' ', COALESCE(st.last_name, ''))) AS student_name,
        COALESCE(
          ROUND(
            (COUNT(ca.session_attendance_id) FILTER (WHERE ca.attendance_status = 'present')::numeric /
             NULLIF(COUNT(ca.session_attendance_id), 0)::numeric) * 100, 1
          ), 100.0
        )::float AS attendance_rate,
        COUNT(DISTINCT sub.submission_id)::int AS submission_count,
        ROUND(AVG(rev.obtained_marks)::numeric, 1)::float AS average_marks
      FROM public.student_enrollments se
      JOIN public.students st ON st.student_id = se.student_id
      LEFT JOIN public.classroom_session_attendance ca ON ca.student_id = st.student_id
      LEFT JOIN public.learning_activity_submissions sub ON sub.student_id = st.student_id
      LEFT JOIN public.learning_activity_submission_reviews rev ON rev.submission_id = sub.submission_id
      WHERE se.section_id = ${sectionId}::uuid
        AND st.org_id = ${orgId}::uuid
        AND se.status = 'active'
      GROUP BY st.student_id, st.admission_no, st.first_name, st.last_name
      ORDER BY st.first_name ASC, st.last_name ASC
      LIMIT 50
    `);

    return students;
  }

  /**
   * Create an AI Copilot Generation Request in the database.
   */
  static async createGenerationRequest(data: {
    orgId: string;
    userId: string;
    facultyAssignmentId: string;
    sectionId: string;
    academicYearGradeSubjectId: string;
    curriculumPlanId: string;
    generationType: 'worksheet' | 'quiz' | 'question_paper' | 'question_paper_blueprint';
    title: string;
    teacherInstructions?: string | null;
    generationConfig: any;
    generatedContent: any;
    generatedAnswerKey?: any;
    requestStatus: 'ready_for_review' | 'queued';
  }) {
    const rows = await prisma.$queryRaw<Array<{ generation_request_id: string }>>(Prisma.sql`
      INSERT INTO public.ai_copilot_generation_requests (
        org_id,
        created_by_user_id,
        faculty_assignment_id,
        section_id,
        academic_year_grade_subject_id,
        curriculum_plan_id,
        generation_type,
        title,
        teacher_instructions,
        generation_config,
        generated_content,
        generated_answer_key,
        request_status
      ) VALUES (
        ${data.orgId}::uuid,
        ${data.userId}::uuid,
        ${data.facultyAssignmentId}::uuid,
        ${data.sectionId}::uuid,
        ${data.academicYearGradeSubjectId}::uuid,
        ${data.curriculumPlanId}::uuid,
        ${data.generationType}::public.ai_copilot_generation_type,
        ${data.title},
        ${data.teacherInstructions || null},
        ${JSON.stringify(data.generationConfig || {})}::jsonb,
        ${JSON.stringify(data.generatedContent || {})}::jsonb,
        ${JSON.stringify(data.generatedAnswerKey || {})}::jsonb,
        ${data.requestStatus}::public.ai_copilot_request_status
      )
      RETURNING generation_request_id::text
    `);

    return rows[0] || null;
  }

  /**
   * Create an approved material and material version from an approved generation request.
   */
  static async approveMaterialAndCreateVersion(params: {
    orgId: string;
    staffId: string;
    userId: string;
    generationRequestId: string;
    title: string;
    changeSummary?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Record teacher review on generation request while keeping request_status = 'ready_for_review'
      const updatedReqs = await tx.$queryRaw<
        Array<{
          generation_request_id: string;
          faculty_assignment_id: string;
          section_id: string;
          academic_year_grade_subject_id: string;
          curriculum_plan_id: string;
          generation_type: string;
          generation_config: any;
          generated_content: any;
          generated_answer_key: any;
        }>
      >(Prisma.sql`
        UPDATE public.ai_copilot_generation_requests
        SET
          reviewed_by_staff_id = ${params.staffId}::uuid,
          reviewed_at = now(),
          review_notes = ${params.changeSummary || 'Approved by teacher'},
          updated_at = now()
        WHERE generation_request_id = ${params.generationRequestId}::uuid
          AND org_id = ${params.orgId}::uuid
        RETURNING
          generation_request_id::text,
          faculty_assignment_id::text,
          section_id::text,
          academic_year_grade_subject_id::text,
          curriculum_plan_id::text,
          generation_type::text,
          generation_config,
          generated_content,
          generated_answer_key
      `);

      if (!updatedReqs || updatedReqs.length === 0) {
        throw new Error('Generation request not found or does not belong to this organization');
      }
      const updatedReq = updatedReqs[0];

      // 2. Insert into ai_copilot_materials
      const materialRows = await tx.$queryRaw<Array<{ material_id: string }>>(Prisma.sql`
        INSERT INTO public.ai_copilot_materials (
          org_id,
          source_generation_request_id,
          faculty_assignment_id,
          section_id,
          academic_year_grade_subject_id,
          curriculum_plan_id,
          material_type,
          title,
          created_by_user_id,
          approved_by_staff_id,
          approved_at,
          material_status
        ) VALUES (
          ${params.orgId}::uuid,
          ${params.generationRequestId}::uuid,
          ${updatedReq.faculty_assignment_id}::uuid,
          ${updatedReq.section_id}::uuid,
          ${updatedReq.academic_year_grade_subject_id}::uuid,
          ${updatedReq.curriculum_plan_id}::uuid,
          ${updatedReq.generation_type}::public.ai_copilot_generation_type,
          ${params.title},
          ${params.userId}::uuid,
          ${params.staffId}::uuid,
          now(),
          'active'::public.ai_copilot_material_status
        )
        RETURNING material_id::text
      `);
      const material = materialRows[0];

      // 3. Insert initial material version 1
      const versionRows = await tx.$queryRaw<Array<{ material_version_id: string }>>(Prisma.sql`
        INSERT INTO public.ai_copilot_material_versions (
          org_id,
          material_id,
          version_number,
          source_generation_request_id,
          content,
          answer_key,
          change_summary,
          created_by_user_id,
          approved_by_staff_id,
          approved_at
        ) VALUES (
          ${params.orgId}::uuid,
          ${material.material_id}::uuid,
          1,
          ${params.generationRequestId}::uuid,
          ${JSON.stringify(updatedReq.generated_content || updatedReq.generation_config || {})}::jsonb,
          ${JSON.stringify(updatedReq.generated_answer_key || {})}::jsonb,
          ${params.changeSummary || 'Initial version approved'},
          ${params.userId}::uuid,
          ${params.staffId}::uuid,
          now()
        )
        RETURNING material_version_id::text
      `);

      // 4. Finally transition request_status to 'approved' and clear temporary payload
      await tx.$executeRaw(Prisma.sql`
        UPDATE public.ai_copilot_generation_requests
        SET
          request_status = 'approved'::public.ai_copilot_request_status,
          generated_content = NULL,
          generated_answer_key = NULL,
          updated_at = now()
        WHERE generation_request_id = ${params.generationRequestId}::uuid
          AND org_id = ${params.orgId}::uuid
      `);

      return { material_id: material.material_id, version_id: versionRows[0]?.material_version_id };
    });
  }

  /**
   * List approved materials for a teacher or section.
   */
  static async listApprovedMaterials(orgId: string, staffId: string) {
    return prisma.$queryRaw<
      Array<{
        material_id: string;
        org_id: string;
        material_type: string;
        title: string;
        created_at: string;
        material_status: string;
      }>
    >(Prisma.sql`
      SELECT
        material_id::text,
        org_id::text,
        material_type::text,
        title,
        created_at::text,
        material_status::text
      FROM public.ai_copilot_materials
      WHERE org_id = ${orgId}::uuid
        AND approved_by_staff_id = ${staffId}::uuid
        AND material_status = 'active'
      ORDER BY created_at DESC
      LIMIT 50
    `);
  }

  /**
   * Record an AI intervention recommendation for a student.
   */
  static async recordInterventionRecommendation(data: {
    orgId: string;
    studentId: string;
    academicYearGradeSubjectId: string;
    curriculumPlanId?: string | null;
    curriculumUnitId?: string | null;
    recommendationType: string;
    recommendationText: string;
    evidenceSnapshot: any;
    generatedByUserId?: string | null;
  }) {
    const rows = await prisma.$queryRaw<Array<{ recommendation_id: string }>>(Prisma.sql`
      INSERT INTO public.ai_copilot_intervention_recommendations (
        org_id,
        student_id,
        academic_year_grade_subject_id,
        curriculum_plan_id,
        curriculum_unit_id,
        recommendation_type,
        recommendation_text,
        evidence_snapshot,
        source_data_as_of,
        recommendation_status,
        generated_by_user_id
      ) VALUES (
        ${data.orgId}::uuid,
        ${data.studentId}::uuid,
        ${data.academicYearGradeSubjectId}::uuid,
        ${data.curriculumPlanId ? Prisma.sql`${data.curriculumPlanId}::uuid` : Prisma.sql`NULL`},
        ${data.curriculumUnitId ? Prisma.sql`${data.curriculumUnitId}::uuid` : Prisma.sql`NULL`},
        ${data.recommendationType},
        ${data.recommendationText},
        ${JSON.stringify(data.evidenceSnapshot || {})}::jsonb,
        now(),
        'active'::public.ai_copilot_recommendation_status,
        ${data.generatedByUserId ? Prisma.sql`${data.generatedByUserId}::uuid` : Prisma.sql`NULL`}
      )
      RETURNING recommendation_id::text
    `);

    return rows[0] || null;
  }

  /**
   * List active intervention recommendations for an assignment offering.
   */
  static async listActiveRecommendations(orgId: string, subjectOfferingId: string) {
    return prisma.$queryRaw<
      Array<{
        recommendation_id: string;
        student_id: string;
        student_name: string;
        admission_no: string;
        recommendation_type: string;
        recommendation_text: string;
        created_at: string;
      }>
    >(Prisma.sql`
      SELECT
        r.recommendation_id::text,
        r.student_id::text,
        TRIM(CONCAT(st.first_name, ' ', COALESCE(st.last_name, ''))) AS student_name,
        st.admission_no,
        r.recommendation_type,
        r.recommendation_text,
        r.created_at::text
      FROM public.ai_copilot_intervention_recommendations r
      JOIN public.students st ON st.student_id = r.student_id
      WHERE r.org_id = ${orgId}::uuid
        AND r.academic_year_grade_subject_id = ${subjectOfferingId}::uuid
        AND r.recommendation_status = 'active'
      ORDER BY r.created_at DESC
      LIMIT 50
    `);
  }

  /**
   * Dismiss an intervention recommendation.
   */
  static async dismissRecommendation(orgId: string, recommendationId: string) {
    return prisma.$executeRaw(Prisma.sql`
      UPDATE public.ai_copilot_intervention_recommendations
      SET
        recommendation_status = 'dismissed'::public.ai_copilot_recommendation_status,
        updated_at = now()
      WHERE org_id = ${orgId}::uuid
        AND recommendation_id = ${recommendationId}::uuid
        AND recommendation_status = 'active'
    `);
  }
}
