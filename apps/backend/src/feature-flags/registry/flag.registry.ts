import { FeatureFlagDefinition } from '../contracts/feature-flag.contracts';

export class FeatureFlagRegistry {
  private static flags = new Map<string, FeatureFlagDefinition>([
    [
      'new_admission_portal',
      {
        key: 'new_admission_portal',
        description: 'New admission application portal UI & workflow',
        isEnabled: true,
        percentage: 100,
      },
    ],
    [
      'beta_fee_analytics',
      {
        key: 'beta_fee_analytics',
        description: 'Beta analytics dashboard for fee collections',
        isEnabled: true,
        roles: ['ADMIN'],
        percentage: 50,
      },
    ],
  ]);

  public static register(flag: FeatureFlagDefinition): void {
    this.flags.set(flag.key, flag);
  }

  public static get(key: string): FeatureFlagDefinition | undefined {
    return this.flags.get(key);
  }

  public static getAll(): FeatureFlagDefinition[] {
    return Array.from(this.flags.values());
  }
}
