import { loggerService } from '../../observability/logger.service';
import { MetricsRegistry } from '../../observability/metrics/metrics.engine';

export enum StorageEventType {
  UPLOAD = 'FileUpload',
  DOWNLOAD = 'FileDownload',
  DELETE = 'FileDelete',
  COPIED = 'FileCopied',
  MOVED = 'FileMoved',
  VALIDATION_FAILED = 'FileValidationFailed',
}

export class StorageEvents {
  private static metrics = MetricsRegistry.getInstance();

  public static emit(type: StorageEventType, key: string, meta?: Record<string, any>): void {
    this.metrics.incrementCounter(`storage_event_${type.toLowerCase()}_total`);
    loggerService.info(`📁 [Storage Event: ${type}] Key: ${key}`, meta);
  }
}
