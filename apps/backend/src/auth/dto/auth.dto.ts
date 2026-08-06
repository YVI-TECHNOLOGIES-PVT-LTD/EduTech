import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;

export const LogoutRequestSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

export interface LoginResponseData {
  user: {
    id: string;
    email: string;
    orgId: string;
    role: string;
    roles: string[];
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface CurrentUserResponseData {
  id: string;
  email: string;
  orgId: string;
  role: string;
  roles: string[];
  permissions: string[];
}
