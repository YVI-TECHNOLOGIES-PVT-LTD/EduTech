import prisma from '../../../lib/prismaClient';
import { UserTimelineDto, UserTimelineEventDto } from '../dto/response/user-timeline.dto';

const db: any = prisma;

export class UserTimelineQuery {
  static async execute(userId: string): Promise<UserTimelineDto> {
    const user = await db.users.findUnique({
      where: { user_id: userId },
      include: {
        user_roles_user_idTousers: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!user) {
      return { user_id: userId, timeline: [] };
    }

    const timeline: UserTimelineEventDto[] = [];
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

    // 1. User Account Creation
    if (user.created_at) {
      timeline.push({
        id: `created-${user.user_id}`,
        type: 'USER_CREATED',
        title: 'User Profile Created',
        description: `Created account for ${fullName} (${user.email})`,
        performed_by: user.created_by || null,
        timestamp: new Date(user.created_at).toISOString(),
      });
    }

    // 2. Last Login Timestamp
    if (user.last_login_at) {
      timeline.push({
        id: `login-${user.user_id}`,
        type: 'LAST_LOGIN',
        title: 'User Authenticated',
        description: `Last logged in at ${new Date(user.last_login_at).toISOString()}`,
        performed_by: user.user_id,
        timestamp: new Date(user.last_login_at).toISOString(),
      });
    }

    // 3. User Role Grants
    if (Array.isArray(user.user_roles_user_idTousers)) {
      for (const ur of user.user_roles_user_idTousers) {
        if (ur.granted_at) {
          timeline.push({
            id: `role-${ur.role_id}`,
            type: 'ROLE_ASSIGNED',
            title: 'Role Assigned',
            description: `Assigned role '${ur.roles?.role_name || ur.role_id}'`,
            performed_by: ur.granted_by || null,
            timestamp: new Date(ur.granted_at).toISOString(),
          });
        }
      }
    }

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      user_id: userId,
      timeline,
    };
  }
}
