import { ENV } from './env';

export const APP_CONFIG = {
  name: ENV.APP_TITLE,
  version: '1.0.0-stage1',
  copyright: `© ${new Date().getFullYear()} EduTrack ERP Platform. All rights reserved.`,
  supportEmail: 'support@edutrack.io',
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
  },
  fileUpload: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedDocTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  },
  dateFormat: 'YYYY-MM-DD',
  dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  displayDateFormat: 'MMM DD, YYYY',
  currency: {
    code: 'INR',
    symbol: '₹',
  },
} as const;
