export interface StorageFile {
  filename: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface StoredFileResult {
  fileId: string;
  url: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface IStorageService {
  upload(file: StorageFile, pathPrefix?: string): Promise<StoredFileResult>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<string>;
}
