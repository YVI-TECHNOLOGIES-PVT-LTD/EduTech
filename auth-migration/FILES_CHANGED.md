# Modified & Created Files Inventory

## 1. Created Files

- [apps/backend/src/auth/auth.service.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/auth.service.ts): Native Prisma + bcrypt + JWT auth service.
- [apps/backend/src/auth/auth.controller.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/auth.controller.ts): Auth controller delegating to `AuthService`.
- [apps/backend/src/auth/auth.routes.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/auth.routes.ts): Public & protected auth routers.

## 2. Modified Files

- [apps/backend/package.json](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/package.json): Added `jsonwebtoken` & `bcryptjs`.
- [apps/backend/src/auth/session.service.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/auth/session.service.ts): Converted session validation to native Prisma + JWT.
- [apps/backend/src/routes.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/routes.ts): Mounted `publicAuthRouter` before global `authenticate` guard.
- [apps/backend/src/modules/admission/admission.service.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission/admission.service.ts): Converted public parent account registration to native Prisma + `bcrypt.hash`.
- [apps/backend/src/modules/admission/services/application/PublicApplicationService.ts](file:///c:/Users/DELL/Desktop/EduTech/apps/backend/src/modules/admission/services/application/PublicApplicationService.ts): Converted parent user creation to native Prisma + `bcrypt.hash`.
