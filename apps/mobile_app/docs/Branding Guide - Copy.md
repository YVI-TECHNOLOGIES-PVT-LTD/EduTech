# EduTrack Mobile ERP — Multi-Tenant White-Label Branding Guide

## Overview
EduTrack supports multi-tenant white-label branding across 1,000+ institution tenants.

## Injecting School Branding
```tsx
import { createSchoolTheme } from '@/theme/utils/themeUtils';

// Instantiates custom primary theme dynamically for a specific tenant
const tenantTheme = createSchoolTheme({
  schoolId: 'sch_9918',
  schoolName: 'Oxford Academy',
  primaryColor: '#0284c7', // Custom School Brand Color
}, isDark);
```
