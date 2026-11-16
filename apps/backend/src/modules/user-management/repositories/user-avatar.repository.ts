import prisma from '../../../lib/prismaClient';

export class UserAvatarRepository {
  /**
   * Reads users.avatar_url for a specific user_id.
   * Returns the Supabase Storage object path or null.
   */
  static async getAvatarPath(userId: string): Promise<string | null> {
    if (!userId) return null;
    const result = await prisma.$queryRaw<Array<{ avatar_url: string | null }>>`
      SELECT avatar_url FROM public.users WHERE user_id = ${userId}::uuid LIMIT 1
    `;
    return result && result.length > 0 ? result[0].avatar_url : null;
  }

  /**
   * Updates users.avatar_url with the Supabase Storage object path.
   */
  static async updateAvatarPath(userId: string, avatarPath: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to update avatar path');
    await prisma.$executeRaw`
      UPDATE public.users
      SET avatar_url = ${avatarPath}, updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `;
  }

  /**
   * Clears users.avatar_url by setting it to NULL.
   */
  static async clearAvatarPath(userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required to clear avatar path');
    await prisma.$executeRaw`
      UPDATE public.users
      SET avatar_url = NULL, updated_at = NOW()
      WHERE user_id = ${userId}::uuid
    `;
  }
}
