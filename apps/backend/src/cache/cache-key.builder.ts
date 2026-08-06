export class CacheKeyBuilder {
  public static build(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].filter(Boolean).join(':');
  }

  public static tenantKey(tenantId: string, moduleName: string, entityId: string): string {
    return `tenant:${tenantId}:${moduleName}:${entityId}`;
  }
}
