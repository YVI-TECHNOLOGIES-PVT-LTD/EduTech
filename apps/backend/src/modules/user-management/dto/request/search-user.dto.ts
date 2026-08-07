import { z } from 'zod';
import { user_status } from '../../constants/user.constants';

export const searchUserSchema = z.object({
  searchText: z.string().optional(),
  org_id: z.string().uuid().optional(),
  status: z.nativeEnum(user_status as any).optional(),
  role_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z
    .enum(['created_at', 'updated_at', 'first_name', 'last_login_at'])
    .optional()
    .default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SearchUserDto = z.infer<typeof searchUserSchema>;
