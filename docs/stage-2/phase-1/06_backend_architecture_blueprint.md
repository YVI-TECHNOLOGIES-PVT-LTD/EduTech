# EduTrack ERP — Stage-2 Phase 1: Backend Architecture Blueprint

**Document ID:** `docs/stage-2/phase-1/06_backend_architecture_blueprint.md`  
**Phase:** Stage-2 Phase 1: Foundation & Database Contract Verification  
**Author:** Backend Engineering Lead & Senior Software Architect  
**Date:** November 2026  
**Status:** COMPLETE / ARCHITECTURAL BLUEPRINT

---

## 1. Executive Summary

This blueprint defines the uniform backend architecture, directory conventions, and API communication standards for implementing the six modules of Stage 2 (**Academic Planning & Digital Campus Setup**).

All proposed patterns are designed to seamlessly align with existing backend conventions in `apps/backend/src/` (e.g. `academic-management`, `admission-management`, and `fees`), avoiding duplicate architectural styles while eliminating multi-tenant vulnerabilities.

---

## 2. Proposed Stage-2 Backend Directory Structure

Stage-2 backend logic will be organized under `apps/backend/src/modules/academic-planning/`, partitioned into modular sub-domains:

```text
apps/backend/src/modules/academic-planning/
├── controllers/
│   ├── academic-year-config.controller.ts    # Module 1
│   ├── framework-mapping.controller.ts       # Module 2
│   ├── curriculum-designer.controller.ts     # Module 3
│   ├── digital-resource.controller.ts        # Module 4
│   ├── lesson-planning.controller.ts         # Module 5
│   └── academic-setup-publish.controller.ts  # Module 6
├── services/
│   ├── academic-year-config.service.ts
│   ├── framework-mapping.service.ts
│   ├── curriculum-designer.service.ts
│   ├── digital-resource.service.ts
│   ├── lesson-planning.service.ts
│   ├── academic-setup-publish.service.ts
│   └── ai-academic-assistant.service.ts      # Shared AI generation helper
├── repositories/
│   ├── academic-config.repository.ts
│   ├── framework-mapping.repository.ts
│   ├── curriculum.repository.ts
│   ├── digital-resource.repository.ts
│   ├── lesson-planning.repository.ts
│   └── setup-publish.repository.ts
├── dto/
│   ├── request/
│   │   ├── create-academic-year.dto.ts
│   │   ├── create-framework-mapping.dto.ts
│   │   ├── generate-curriculum.dto.ts
│   │   ├── upload-resource.dto.ts
│   │   ├── create-lesson-plan.dto.ts
│   │   └── publish-academic-setup.dto.ts
│   └── response/
│       ├── academic-tree.response.dto.ts
│       ├── framework-matrix.response.dto.ts
│       ├── curriculum-unit.response.dto.ts
│       └── publication-summary.response.dto.ts
├── validators/
│   └── academic-planning.validator.ts        # Zod request validators
├── policies/
│   └── academic-planning.policy.ts           # Permission check helper
├── routes/
│   └── academic-planning.routes.ts           # Sub-router mounted in routes.ts
└── index.ts                                  # Public module exports
```

---

## 3. Standardized API Conventions

### 3.1 Route Naming & Versioning

- All Stage-2 endpoints will be versioned with prefix `/v1/academic/...`.
- Plural nouns for resource collections (e.g. `/v1/academic/curriculum-plans`, `/v1/academic/resources`).
- Specific actions formatted as sub-resources (e.g. `/v1/academic/curriculum-plans/:id/ai-generate-units`, `/v1/academic/setup/validate`, `/v1/academic/setup/publish`).

### 3.2 Request Envelope & Validation

- Content-Type: `application/json` (or `multipart/form-data` for file uploads).
- Incoming payloads must be validated using Zod schemas via middleware before reaching the controller.
- Idempotency middleware (`checkIdempotency`) must be applied to non-safe write operations (`POST`).

### 3.3 Response Envelope

All endpoints must return a standardized JSON envelope:

#### Successful Response:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "requestId": "c1f7b0e1-4c6e-4e9b-b9f1-32a2f64b8a2e"
  }
}
```

#### Error Response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid curriculum unit dates",
    "details": [
      {
        "field": "end_date",
        "message": "End date must be after start date"
      }
    ],
    "requestId": "c1f7b0e1-4c6e-4e9b-b9f1-32a2f64b8a2e"
  }
}
```

---

## 4. Layer Implementation Standards

### 4.1 Controller Pattern

Controllers must only handle HTTP concerns:

```typescript
export class CurriculumDesignerController {
  static async generateCurriculumPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.context!.user.org_id; // Never trust req.query or req.body for org_id
      const userId = req.context!.user.id;
      const validatedInput = generateCurriculumSchema.parse(req.body);

      const plan = await CurriculumDesignerService.generatePlan({
        orgId,
        authorId: userId,
        ...validatedInput,
      });

      return res.status(201).json({
        success: true,
        data: plan,
        meta: { requestId: req.headers['x-request-id'] },
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### 4.2 Service & Transaction Pattern

Business rules, domain invariants, and atomic writes must be encapsulated in services:

```typescript
export class AcademicSetupPublishService {
  static async publishSetup(params: { orgId: string; academicYearId: string; userId: string }) {
    // 1. Validate completeness
    const eligibility = await this.checkPublishEligibility(params.orgId, params.academicYearId);
    if (!eligibility.isEligible) {
      throw new BusinessRuleError(
        'Academic setup is incomplete and cannot be published.',
        eligibility.missingItems,
      );
    }

    // 2. Atomic transition
    return await prisma.$transaction(async (tx) => {
      const updatedYear = await tx.academic_years.update({
        where: { academic_year_id: params.academicYearId },
        data: { status: 'open' },
      });

      // If physical audit table exists, write history; otherwise log securely
      logger.info(
        `[AcademicSetup] Academic Year ${params.academicYearId} published by user ${params.userId}`,
      );
      return updatedYear;
    });
  }
}
```

### 4.3 Repository Pattern

Repositories must handle queries and enforce tenant filtering:

```typescript
export class FrameworkMappingRepository {
  static async getFrameworksForOrg(orgId: string) {
    // Stage 1 supports grades.board; Stage 2 maps full frameworks
    return await prisma.grades.findMany({
      where: { org_id: orgId, is_active: true },
      select: { grade_id: true, grade_name: true, board: true },
      orderBy: { display_order: 'asc' },
    });
  }
}
```

---

## 5. Representative Proposed API Contracts

> [!NOTE]
> The following contracts represent proposed Stage-2 interfaces. They are not yet implemented.

### Contract 1: Validate Academic Setup for Publishing

- **Endpoint:** `POST /v1/academic/setup/validate`
- **Method:** `POST`
- **Guards:** `authenticate`, `checkPermission('ACADEMIC_SETUP')`
- **Proposed Request Body:**
  ```json
  {
    "academic_year_id": "8a31e78d-6d55-4e3f-911e-b83bfae34510"
  }
  ```
- **Proposed Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "academic_year_id": "8a31e78d-6d55-4e3f-911e-b83bfae34510",
      "academic_year_name": "Academic Year 2026-2027",
      "is_eligible": true,
      "checks": {
        "grades_configured": true,
        "sections_assigned": true,
        "class_teachers_assigned": true,
        "curriculum_mapped": true,
        "calendar_created": true
      },
      "warnings": ["Section 10-C has no assigned assistant class teacher."]
    }
  }
  ```

### Contract 2: AI Generate Curriculum Outline

- **Endpoint:** `POST /v1/academic/curriculum/ai-generate`
- **Method:** `POST`
- **Guards:** `authenticate`, `checkPermission('ACADEMIC_SETUP')`, `checkIdempotency`
- **Proposed Request Body:**
  ```json
  {
    "grade_id": "b3e0c091-6284-48f1-a18d-f5f4a7c8d910",
    "subject_name": "Science",
    "board": "CBSE",
    "term": "Term 1",
    "unit_count": 4,
    "pedagogy_focus": "Experiential Learning"
  }
  ```
- **Proposed Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "subject": "Science",
      "grade": "Grade 10",
      "units": [
        {
          "unit_number": 1,
          "title": "Chemical Reactions and Equations",
          "suggested_duration_weeks": 3,
          "learning_outcomes": [
            {
              "outcome_text": "Write and balance chemical equations",
              "bloom_level": "APPLY"
            }
          ]
        }
      ]
    }
  }
  ```
