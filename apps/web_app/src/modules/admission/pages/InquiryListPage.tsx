import React from 'react';
import { LeadsManagementPage } from './front-office/LeadsManagementPage';
import { PageContainer } from '@/components/layout/PageLayout';

export function InquiryListPage() {
  return (
    <PageContainer variant="full">
      <LeadsManagementPage />
    </PageContainer>
  );
}

export default InquiryListPage;
