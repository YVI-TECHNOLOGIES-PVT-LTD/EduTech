export interface BaseDto {
  readonly id?: string;
  readonly createdAt?: Date | string;
  readonly updatedAt?: Date | string;
  readonly deletedAt?: Date | string | null;
}

export interface TenantScopedDto extends BaseDto {
  readonly tenantId?: string;
  readonly orgId?: string;
}

export interface AuditableDto extends TenantScopedDto {
  readonly createdBy?: string;
  readonly updatedBy?: string;
}
