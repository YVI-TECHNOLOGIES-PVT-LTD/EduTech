import { ILogExporter, StructuredLogRecord } from '../contracts/obs.contracts';

export class ConsoleExporter implements ILogExporter {
  public export(record: StructuredLogRecord): void {
    const formatted = JSON.stringify(record);
    if (record.level === 'ERROR' || record.level === 'FATAL') {
      console.error(formatted);
    } else if (record.level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }
}

export class NoopExporter implements ILogExporter {
  public export(_record: StructuredLogRecord): void {
    // Silent
  }
}
