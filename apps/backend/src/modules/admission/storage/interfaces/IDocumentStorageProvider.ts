export interface IDocumentStorageProvider {
    upload(bucket: string, path: string, fileBuffer: Buffer, mimeType: string): Promise<string>;
    download(bucket: string, path: string): Promise<Buffer>;
    delete(bucket: string, path: string): Promise<void>;
    exists(bucket: string, path: string): Promise<boolean>;
    generateSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
}
