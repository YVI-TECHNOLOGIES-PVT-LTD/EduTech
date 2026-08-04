export const APP_CONFIG = {
    name: 'School ERP Suite',
    version: '1.0.0',
    company: 'Antigravity Systems',
    supportEmail: 'support@antigravity-erp.com',
    defaultLocale: 'en',
    availableLocales: ['en', 'te'],
    pagination: {
        defaultPageSize: 10,
        pageSizeOptions: [5, 10, 20, 50],
    },
    files: {
        maxUploadSizeMB: 10, // 10MB limit
        allowedDocumentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    }
};
