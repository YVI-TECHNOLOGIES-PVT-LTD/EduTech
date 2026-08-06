export const TTL_CONSTANTS = {
  SHORT: 60, // 1 minute (frequently changing data)
  MEDIUM: 300, // 5 minutes (standard cache TTL)
  LONG: 3600, // 1 hour (configuration & static reference data)
  VERY_LONG: 86400, // 24 hours (rarely changing system metadata)
} as const;

export type TtlCategory = keyof typeof TTL_CONSTANTS | 'CUSTOM';

export class TtlPolicyResolver {
  public static resolve(category: TtlCategory, customSeconds?: number): number {
    if (category === 'CUSTOM' && customSeconds !== undefined) {
      return customSeconds;
    }
    return TTL_CONSTANTS[category as keyof typeof TTL_CONSTANTS] || TTL_CONSTANTS.MEDIUM;
  }
}
