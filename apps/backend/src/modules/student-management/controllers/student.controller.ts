import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { StudentIdentityLinkageService } from '../services/student-identity-linkage.service';
import { getAuthenticatedOrgId, requireAuthenticatedOrgId } from '../../../utils/tenant-context';
import { createStudentSchema } from '../dto/request/create-student.dto';
import { updateStudentSchema } from '../dto/request/update-student.dto';
import { updateStudentStatusSchema } from '../dto/request/update-status.dto';
import { searchStudentSchema } from '../dto/request/search-student.dto';
import { StudentError } from '../errors/student.errors';
import { ParentStudentLifecycleService } from '../../parent-management/services/parent.student-lifecycle.service';
import { ParentError } from '../../parent-management/errors/parent.errors';
import prisma from '../../../lib/prismaClient';
import { UserAvatarService } from '../../user-management/services/user-avatar.service';

export class StudentController {
  static async create(req: Request, res: Response) {
    try {
      const parsed = createStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.createStudent(parsed.data, userId);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).context?.user || (req as any).user;
      const isParentOnly =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r: string) =>
          ['ADMIN', 'SUPERADMIN', 'ADMISSION_OFFICER', 'STAFF', 'FRONT_OFFICE'].includes(r),
        );

      if (isParentOnly && user?.id) {
        await ParentStudentLifecycleService.assertParentCanAccessStudent(user.id, id, user.org_id);
      }

      const result = await StudentService.getStudentById(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.updateStudent(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.deleteStudent(id, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const parsed = searchStudentSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid search parameters',
          details: parsed.error.format(),
        });
      }

      const result = await StudentService.searchStudents(parsed.data);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = updateStudentStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await StudentService.updateStatus(id, parsed.data, userId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getApprovedApplications(req: Request, res: Response) {
    try {
      const user = req.context?.user;
      const orgId = (req as any).tenantOrgId || user?.org_id || user?.school_id || undefined;
      const search = req.query.search as string | undefined;

      const result = await StudentService.getApprovedApplications(orgId, search);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async convertApplication(req: Request, res: Response) {
    try {
      const { applicationId } = req.params;
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;

      const result = await StudentService.convertApplicationToStudent(
        applicationId,
        userId,
        orgId,
        req.body,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getIdentityLinkageAudit(req: Request, res: Response) {
    try {
      const orgId = requireAuthenticatedOrgId(req);
      const report = await StudentIdentityLinkageService.getLinkageAudit(orgId);
      return res.json(report);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
      });
    }
  }

  static async dryRunIdentityProvisioning(req: Request, res: Response) {
    try {
      const orgId = requireAuthenticatedOrgId(req);
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const plan = await StudentIdentityLinkageService.dryRunProvisioningPlan(orgId, limit);
      return res.json(plan);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
      });
    }
  }

  static async linkVerifiedUser(req: Request, res: Response) {
    try {
      const orgId = requireAuthenticatedOrgId(req);
      const { id } = req.params;
      const targetUserId = req.body?.user_id;
      const actorId = req.context?.user?.id || null;

      if (!targetUserId || typeof targetUserId !== 'string') {
        return res.status(400).json({ error: 'user_id is required', code: 'VALIDATION_FAILED' });
      }

      const linked = await StudentIdentityLinkageService.linkExistingUserToStudent(
        orgId,
        id,
        targetUserId,
        actorId,
      );
      return res.json(linked);
    } catch (error: any) {
      if (error instanceof StudentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(error.statusCode || 500).json({
        error: error.message || 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
      });
    }
  }

  static async uploadAvatar(req: Request, res: Response) {
    try {
      const { id: studentId } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'Image file is required' });
      }

      const user = (req as any).context?.user || (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const isStaffOrAdmin = (user.roles || []).some((r: string) =>
        [
          'SUPERADMIN',
          'ADMIN',
          'ORG_ADMIN',
          'HOI',
          'STAFF',
          'FACULTY',
          'ADMISSION_OFFICER',
        ].includes(r),
      );
      const isParent = (user.roles || []).includes('PARENT');

      if (!isStaffOrAdmin && isParent) {
        await ParentStudentLifecycleService.assertParentCanAccessStudent(
          user.id,
          studentId,
          user.org_id,
        );
      } else if (!isStaffOrAdmin) {
        return res.status(403).json({ error: 'Unauthorized to upload student photo' });
      }

      // Check student and ensure target user_id
      const student = await prisma.students.findUnique({
        where: { student_id: studentId },
        select: { student_id: true, user_id: true, org_id: true },
      });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Multi-tenant check
      if (user.org_id && student.org_id !== user.org_id) {
        return res.status(403).json({ error: 'Cross-organization access forbidden' });
      }

      let targetUserId = student.user_id;
      if (!targetUserId) {
        // Safe shadow user creation for student to store avatar_url without schema modifications
        const createdUser = await prisma.users.create({
          data: {
            org_id: student.org_id,
            first_name: 'Student',
            email: `stu.${student.student_id}@student.internal`,
            phone: '0000000000',
            country_id: (user as any).country_id || '00000000-0000-0000-0000-000000000001',
          },
        });
        targetUserId = createdUser.user_id;
        await prisma.students.update({
          where: { student_id: studentId },
          data: { user_id: targetUserId },
        });
      }

      const uploadResult = await UserAvatarService.uploadAvatar(targetUserId, file, {
        id: user.id,
        roles: user.roles,
        org_id: user.org_id,
      });

      return res.json({
        student_id: studentId,
        user_id: targetUserId,
        photo_url: uploadResult.avatar_url,
        avatar_url: uploadResult.avatar_url,
        avatarUrl: uploadResult.avatar_url,
        profileImage: UserAvatarService.formatProfileImage(uploadResult.avatar_url),
        expires_at: uploadResult.expires_at,
      });
    } catch (error: any) {
      if (error instanceof ParentError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res
        .status(error.statusCode || 500)
        .json({ error: error.message || 'Internal server error' });
    }
  }

  static async deleteAvatar(req: Request, res: Response) {
    try {
      const { id: studentId } = req.params;
      const user = (req as any).context?.user || (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const isStaffOrAdmin = (user.roles || []).some((r: string) =>
        [
          'SUPERADMIN',
          'ADMIN',
          'ORG_ADMIN',
          'HOI',
          'STAFF',
          'FACULTY',
          'ADMISSION_OFFICER',
        ].includes(r),
      );
      const isParent = (user.roles || []).includes('PARENT');

      if (!isStaffOrAdmin && isParent) {
        await ParentStudentLifecycleService.assertParentCanAccessStudent(
          user.id,
          studentId,
          user.org_id,
        );
      } else if (!isStaffOrAdmin) {
        return res.status(403).json({ error: 'Unauthorized to delete student photo' });
      }

      const student = await prisma.students.findUnique({
        where: { student_id: studentId },
        select: { student_id: true, user_id: true, org_id: true },
      });
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      if (user.org_id && student.org_id !== user.org_id) {
        return res.status(403).json({ error: 'Cross-organization access forbidden' });
      }

      if (student.user_id) {
        await UserAvatarService.deleteAvatar(student.user_id, {
          id: user.id,
          roles: user.roles,
          org_id: user.org_id,
        });
      }

      return res.json({
        student_id: studentId,
        photo_url: null,
        avatar_url: null,
        avatarUrl: null,
        profileImage: { available: false, url: null },
      });
    } catch (error: any) {
      return res
        .status(error.statusCode || 500)
        .json({ error: error.message || 'Internal server error' });
    }
  }
}
