export interface EvaluationContext {
  userId?: string;
  tenantId?: string;
  role?: string;
  environment?: string;
  attributes?: Record<string, any>;
}

export interface FeatureFlagVariant {
  name: string;
  weight: number;
  value?: any;
}

export interface FeatureFlagDefinition {
  key: string;
  description?: string;
  isEnabled: boolean;
  owner?: string;
  category?: string;
  expiresAt?: Date;
  startAt?: Date;
  endAt?: Date;
  dependsOn?: string[];
  tenants?: string[];
  roles?: string[];
  users?: string[];
  percentage?: number;
  variants?: FeatureFlagVariant[];
}

export interface FeatureFlagCapabilities {
  readonly supportsPercentageRollouts: boolean;
  readonly supportsVariants: boolean;
  readonly supportsScheduledRollouts: boolean;
  readonly supportsTargetingRules: boolean;
}

export interface IFeatureFlagProvider {
  readonly name: string;
  readonly capabilities: FeatureFlagCapabilities;
  getFlag(key: string): Promise<FeatureFlagDefinition | null>;
  getAllFlags(): Promise<FeatureFlagDefinition[]>;
  setFlag(definition: FeatureFlagDefinition): Promise<void>;
  ping(): Promise<boolean>;
}
