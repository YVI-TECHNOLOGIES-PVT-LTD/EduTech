export interface AiUsageRecord {
  requestId: string;
  orgId: string;
  userId: string;
  generationType: string;
  provider: string;
  model: string;
  tokensUsed: number;
  durationMs: number;
  success: boolean;
  errorCode?: string;
  timestamp: string;
}

export interface AiUsageMetricsSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageLatencyMs: number;
  requestsByType: Record<string, number>;
  recentErrors: Array<{ type: string; error: string; timestamp: string }>;
}

export class AiCopilotUsageService {
  private static records: AiUsageRecord[] = [];
  private static readonly MAX_RECORDS = 500;

  static recordUsage(record: Omit<AiUsageRecord, 'timestamp'>): void {
    const fullRecord: AiUsageRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };

    this.records.unshift(fullRecord);
    if (this.records.length > this.MAX_RECORDS) {
      this.records.length = this.MAX_RECORDS;
    }
  }

  static getOrgMetrics(orgId: string): AiUsageMetricsSummary {
    const orgRecords = this.records.filter((r) => r.orgId === orgId);
    return this.calculateSummary(orgRecords);
  }

  static getGlobalMetrics(): AiUsageMetricsSummary {
    return this.calculateSummary(this.records);
  }

  private static calculateSummary(records: AiUsageRecord[]): AiUsageMetricsSummary {
    const totalRequests = records.length;
    const successfulRequests = records.filter((r) => r.success).length;
    const failedRequests = records.filter((r) => !r.success).length;

    const totalTokens = records.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
    const totalDuration = records.reduce((sum, r) => sum + (r.durationMs || 0), 0);
    const averageLatencyMs = totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0;

    const requestsByType: Record<string, number> = {};
    for (const r of records) {
      requestsByType[r.generationType] = (requestsByType[r.generationType] || 0) + 1;
    }

    const recentErrors = records
      .filter((r) => !r.success && r.errorCode)
      .slice(0, 10)
      .map((r) => ({
        type: r.generationType,
        error: r.errorCode || 'UNKNOWN_ERROR',
        timestamp: r.timestamp,
      }));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      totalTokens,
      averageLatencyMs,
      requestsByType,
      recentErrors,
    };
  }

  static clear(): void {
    this.records = [];
  }
}
