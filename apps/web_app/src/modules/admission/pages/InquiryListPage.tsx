import React from 'react';
import { useLocation } from 'react-router-dom';
import { InquiryWorkspace } from '../components/inquiry/InquiryWorkspace';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';

export function InquiryListPage() {
  const location = useLocation();
  const isAssignRoute = location.pathname.endsWith('/assign');
  const hashAction = location.hash.replace('#', '');

  return (
    <PageContainer variant="full">
      <PageHeader
        title="Inquiries & Lead Management"
        description="Manage incoming walk-in enquiries, website leads, counsellor assignments, and follow-up queues."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase text-indigo-600 border-indigo-200"
          >
            Front Office Desk
          </Badge>
        }
      />
      <InquiryWorkspace
        mode={isAssignRoute ? 'assignment' : 'workspace'}
        openCreateOnMount={hashAction === 'new'}
        initialSection={hashAction === 'calls' ? 'followups' : undefined}
      />
    </PageContainer>
  );
}

export default InquiryListPage;
