import { Readable } from 'stream';

export interface StorageCapabilities {
  readonly supportsStreaming: boolean;
  readonly supportsSignedUrls: boolean;
  readonly supportsMultipartUpload: boolean;
  readonly supportsCopy: boolean;
  readonly supportsMove: boolean;
}

export interface StorageFilePayload {
  filename: string;
  buffer?: Buffer;
  stream?: Readable;
  mimetype: string;
  size: number;
}

export interface StoredFileResult {
  id: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  checksum: string; // SHA-256
  provider: string;
  url: string;
  uploadedAt: Date;
}

export interface StorageFileKeyParams {
  environment?: string;
  tenantId?: string;
  module: string;
  resource: string;
  identifier: string;
  filename: string;
}

export interface IStorageProvider {
  readonly name: string;
  readonly capabilities: StorageCapabilities;
  upload(key: string, payload: StorageFilePayload): Promise<StoredFileResult>;
  download(key: string): Promise<Buffer>;
  downloadStream?(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  copy?(sourceKey: string, destinationKey: string): Promise<void>;
  move?(sourceKey: string, destinationKey: string): Promise<void>;
  ping(): Promise<boolean>;
}

export interface IVirusScanner {
  scanBuffer(buffer: Buffer): Promise<{ isInfected: boolean; virusName?: string }>;
}
