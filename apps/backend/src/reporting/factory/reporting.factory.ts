import { IReportingEngine } from '../contracts/reporting.contracts';
import { TabularReportEngine, AggregatedMetricEngine, MemoryReportEngine, NoopReportEngine } from '../engines/reporting.engines';
import { configuration } from '../../config';

export class ReportingFactory {
  public createEngine(name?: string): IReportingEngine {
    const engineName = name || (configuration as any)?.reporting?.engine || 'memory';

    switch (engineName.toLowerCase()) {
      case 'tabular':
        return new TabularReportEngine();
      case 'aggregated':
        return new AggregatedMetricEngine();
      case 'noop':
        return new NoopReportEngine();
      case 'memory':
      default:
        return new MemoryReportEngine();
    }
  }
}
