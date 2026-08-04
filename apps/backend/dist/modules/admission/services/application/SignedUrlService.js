"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedUrlService = void 0;
class SignedUrlService {
    constructor(storageProvider) {
        this.storageProvider = storageProvider;
    }
    async generate(bucket, path, expiresInSeconds = 3600) {
        return this.storageProvider.generateSignedUrl(bucket, path, expiresInSeconds);
    }
}
exports.SignedUrlService = SignedUrlService;
