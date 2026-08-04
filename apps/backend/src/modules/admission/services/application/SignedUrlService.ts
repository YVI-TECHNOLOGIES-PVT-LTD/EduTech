import { IDocumentStorageProvider } from '../../storage/interfaces/IDocumentStorageProvider';

export class SignedUrlService {
    constructor(private readonly storageProvider: IDocumentStorageProvider) {}

    public async generate(
        bucket: string,
        path: string,
        expiresInSeconds: number = 3600
    ): Promise<string> {
        return this.storageProvider.generateSignedUrl(bucket, path, expiresInSeconds);
    }
}
