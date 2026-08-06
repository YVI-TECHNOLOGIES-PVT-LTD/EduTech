import { IMetricsRegistry } from '../contracts/obs.contracts';

export class MetricsRegistry implements IMetricsRegistry {
  private static instance: MetricsRegistry;
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  public static getInstance(): MetricsRegistry {
    if (!MetricsRegistry.instance) {
      MetricsRegistry.instance = new MetricsRegistry();
    }
    return MetricsRegistry.instance;
  }

  public incrementCounter(name: string, value = 1, _labels?: Record<string, string>): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  public setGauge(name: string, value: number, _labels?: Record<string, string>): void {
    this.gauges.set(name, value);
  }

  public observeHistogram(name: string, value: number, _labels?: Record<string, string>): void {
    const list = this.histograms.get(name) || [];
    list.push(value);
    if (list.length > 1000) list.shift(); // Keep latest 1000 observations
    this.histograms.set(name, list);
  }

  public recordDuration(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.observeHistogram(name, durationMs, labels);
  }

  public getSnapshot() {
    const mem = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      },
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
    };
  }
}
