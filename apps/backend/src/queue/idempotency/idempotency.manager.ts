import crypto from 'crypto';

export class IdempotencyManager {
  private processedKeys = new Set<string>();

  public static generateKey(queueName: string, jobName: string, data: any): string {
    const serialized = JSON.stringify(data || {});
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');
    return `idemp:${queueName}:${jobName}:${hash}`;
  }

  public isDuplicate(key: string): boolean {
    return this.processedKeys.has(key);
  }

  public markProcessed(key: string, ttlMs = 24 * 3600 * 1000): void {
    this.processedKeys.add(key);
    setTimeout(() => this.processedKeys.delete(key), ttlMs);
  }
}
