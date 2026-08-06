export interface AuthenticatedUserContext {
  readonly id: string;
  readonly orgId: string;
  readonly email: string;
  readonly role: string;
}

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly tenantId?: string;
  readonly user?: AuthenticatedUserContext;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly ip: string;
  readonly userAgent: string;
  readonly timestamp: Date;
  readonly locale?: string;
  readonly timezone?: string;
}
