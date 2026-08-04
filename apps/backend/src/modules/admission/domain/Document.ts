export type DocumentStatus = 'UPLOADED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'CORRECTION_REQUIRED' | 'REUPLOADED';

export class Document {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly documentTypeId: string,
        public readonly originalFilename: string,
        public storedFilename: string,
        public readonly storageProvider: string,
        public readonly storageBucket: string,
        public storagePath: string,
        public mimeType: string,
        public extension: string,
        public fileSize: number,
        public checksum: string,
        public version: number,
        public status: DocumentStatus,
        public readonly uploadedBy: string | null,
        public verifiedBy: string | null,
        public readonly uploadedAt: Date,
        public verifiedAt: Date | null,
        public deletedAt: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public updateStatus(newStatus: DocumentStatus, reviewerId: string | null = null) {
        this.status = newStatus;
        if (newStatus === 'VERIFIED') {
            this.verifiedBy = reviewerId;
            this.verifiedAt = new Date();
        }
        this.updatedAt = new Date();
    }

    public incrementVersion(newPath: string, newChecksum: string, newSize: number) {
        this.version += 1;
        this.storagePath = newPath;
        this.checksum = newChecksum;
        this.fileSize = newSize;
        this.status = 'REUPLOADED';
        this.updatedAt = new Date();
    }

    public softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
