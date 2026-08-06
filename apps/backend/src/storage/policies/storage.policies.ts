export interface StoragePolicy {
  name: string;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export const STORAGE_POLICIES = {
  StudentPhoto: {
    name: 'StudentPhoto',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  Attachment: {
    name: 'Attachment',
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  ReportExport: {
    name: 'ReportExport',
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
  SystemAsset: {
    name: 'SystemAsset',
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
  },
} as const;
