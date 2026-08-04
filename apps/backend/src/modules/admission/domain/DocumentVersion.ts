export class DocumentVersion {
    constructor(
        public readonly id: string,
        public readonly documentId: string,
        public readonly version: number,
        public readonly storagePath: string,
        public readonly checksum: string,
        public readonly uploadedBy: string | null,
        public readonly uploadedAt: Date
    ) {}
}
