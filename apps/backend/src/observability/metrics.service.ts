export class MetricsService {
  private static instance: MetricsService;
  private requestTotal = 0;
  private requestFailed = 0;
  private totalDurationMs = 0;

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  recordRequest(statusCode: number, durationMs: number) {
    this.requestTotal++;
    this.totalDurationMs += durationMs;
    if (statusCode >= 400) {
      this.requestFailed++;
    }
  }

  getMetrics() {
    const avgDuration = this.requestTotal > 0 ? Number((this.totalDurationMs / this.requestTotal).toFixed(2)) : 0;
    const errorRate = this.requestTotal > 0 ? Number(((this.requestFailed / this.requestTotal) * 100).toFixed(2)) : 0;

    return {
      taxonomy: {
        'api.requests.total': this.requestTotal,
        'api.requests.failed': this.requestFailed,
        'api.error.rate.percent': errorRate,
        'api.latency.average.ms': avgDuration,
      },
    };
  }
}

export const metricsService = MetricsService.getInstance();
