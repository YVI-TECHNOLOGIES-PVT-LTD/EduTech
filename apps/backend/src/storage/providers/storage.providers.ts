import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { IStorageProvider, StorageCapabilities, StorageFilePayload, StoredFileResult } from '../contracts/storage.contracts';
import { StorageEvents, StorageEventType } from '../events/storage.events';

export class LocalStorageProvider implements IStorageProvider {
  public readonly name = 'local';
  public readonly capabilities: StorageCapabilities = {
    supportsStreaming: true,
    supportsSignedUrls: true,
    supportsMultipartUpload: false,
    supportsCopy: true,
    supportsMove: true,
  };

  private baseDir: string;

  constructor(baseDir = './uploads') {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolveKeyPath(key: string): string {
    const safeKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    return path.join(this.baseDir, safeKey);
  }

  public async upload(key: string, payload: StorageFilePayload): Promise<StoredFileResult> {
    const filePath = this.resolveKeyPath(key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const buffer = payload.buffer || (payload.stream ? await this.streamToBuffer(payload.stream) : Buffer.from(''));
    fs.writeFileSync(filePath, buffer);

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const result: StoredFileResult = {
      id: crypto.randomUUID(),
      key,
      filename: payload.filename,
      contentType: payload.mimetype,
      size: buffer.length,
      checksum,
      provider: this.name,
      url: `/uploads/${key}`,
      uploadedAt: new Date(),
    };

    StorageEvents.emit(StorageEventType.UPLOAD, key, { size: buffer.length });
    return result;
  }

  public async download(key: string): Promise<Buffer> {
    const filePath = this.resolveKeyPath(key);
    if (!fs.existsSync(filePath)) throw new Error(`File key '${key}' not found`);
    return fs.readFileSync(filePath);
  }

  public async downloadStream(key: string): Promise<Readable> {
    const filePath = this.resolveKeyPath(key);
    if (!fs.existsSync(filePath)) throw new Error(`File key '${key}' not found`);
    return fs.createReadStream(filePath);
  }

  public async delete(key: string): Promise<void> {
    const filePath = this.resolveKeyPath(key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    StorageEvents.emit(StorageEventType.DELETE, key);
  }

  public async exists(key: string): Promise<boolean> {
    return fs.existsSync(this.resolveKeyPath(key));
  }

  public async getSignedUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  public async ping(): Promise<boolean> {
    return fs.existsSync(this.baseDir);
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

export class MemoryStorageProvider implements IStorageProvider {
  public readonly name = 'memory';
  public readonly capabilities: StorageCapabilities = {
    supportsStreaming: true,
    supportsSignedUrls: true,
    supportsMultipartUpload: false,
    supportsCopy: true,
    supportsMove: true,
  };

  private store = new Map<string, { buffer: Buffer; payload: StorageFilePayload; checksum: string }>();

  public async upload(key: string, payload: StorageFilePayload): Promise<StoredFileResult> {
    const buffer = payload.buffer || Buffer.from('');
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    this.store.set(key, { buffer, payload, checksum });

    return {
      id: crypto.randomUUID(),
      key,
      filename: payload.filename,
      contentType: payload.mimetype,
      size: buffer.length,
      checksum,
      provider: this.name,
      url: `memory://${key}`,
      uploadedAt: new Date(),
    };
  }

  public async download(key: string): Promise<Buffer> {
    const entry = this.store.get(key);
    if (!entry) throw new Error(`File key '${key}' not found`);
    return entry.buffer;
  }

  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  public async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  public async getSignedUrl(key: string): Promise<string> {
    return `memory://${key}`;
  }

  public async ping(): Promise<boolean> { return true; }
}

export class NoopStorageProvider implements IStorageProvider {
  public readonly name = 'noop';
  public readonly capabilities: StorageCapabilities = {
    supportsStreaming: false,
    supportsSignedUrls: false,
    supportsMultipartUpload: false,
    supportsCopy: false,
    supportsMove: false,
  };

  public async upload(key: string, payload: StorageFilePayload): Promise<StoredFileResult> {
    return { id: 'noop', key, filename: payload.filename, contentType: payload.mimetype, size: 0, checksum: 'noop', provider: 'noop', url: '', uploadedAt: new Date() };
  }
  public async download(_key: string): Promise<Buffer> { return Buffer.from(''); }
  public async delete(_key: string): Promise<void> {}
  public async exists(_key: string): Promise<boolean> { return false; }
  public async getSignedUrl(_key: string): Promise<string> { return ''; }
  public async ping(): Promise<boolean> { return true; }
}

export class S3StorageProvider implements IStorageProvider {
  public readonly name = 's3';
  public readonly capabilities: StorageCapabilities = {
    supportsStreaming: true,
    supportsSignedUrls: true,
    supportsMultipartUpload: true,
    supportsCopy: true,
    supportsMove: true,
  };

  private fallback = new MemoryStorageProvider();

  public async upload(key: string, payload: StorageFilePayload): Promise<StoredFileResult> {
    return this.fallback.upload(key, payload);
  }
  public async download(key: string): Promise<Buffer> { return this.fallback.download(key); }
  public async delete(key: string): Promise<void> { return this.fallback.delete(key); }
  public async exists(key: string): Promise<boolean> { return this.fallback.exists(key); }
  public async getSignedUrl(key: string): Promise<string> { return `https://s3.amazonaws.com/edutrack-bucket/${key}`; }
  public async ping(): Promise<boolean> { return true; }
}
