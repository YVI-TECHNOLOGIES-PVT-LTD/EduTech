# EduTrack ERP Database Schema Reference

## Primary Models (Prisma ORM & PostgreSQL)

- **`Organization`**: Multi-tenant institutional entity (`id`, `name`, `code`, `email`, `branding`, `settings`).
- **`User`**: User credentials & tenant binding (`id`, `email`, `passwordHash`, `roleId`, `organizationId`).
- **`Role` / `Permission`**: Role-based access control matrix (`id`, `code`, `name`, `permissions[]`).
- **`Department` / `Designation` / `Staff`**: HR hierarchy models (`employeeId`, `firstName`, `lastName`, `departmentId`, `designationId`).
- **`AcademicYear` / `Grade` / `Section`**: Educational structure models (`name`, `code`, `startDate`, `endDate`, `isCurrent`).
- **`Lead` / `CampusVisit`**: CRM inquiry pipeline models (`leadNumber`, `studentName`, `parentName`, `status`, `aiScore`).
- **`Application` / `Document` / `Assessment` / `FeePayment`**: Admissions process models (`applicationNumber`, `status`, `assessmentScore`, `feePaidAmount`).
- **`Student` / `Parent` / `Enrollment`**: Final Stage-1 enrolled student models (`admissionNumber`, `studentId`, `gradeId`, `sectionId`, `status`).
- **`AuditLog`**: System audit trail log (`action`, `performedBy`, `ipAddress`, `timestamp`, `details`).
