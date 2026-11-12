import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, FolderCheck, HelpCircle, MessageSquare } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SocialFeedPage } from '@/modules/communication/pages/SocialFeedPage';
import { FinanceCommunicationHelpdesk } from '@/modules/fees/pages/FinanceCommunicationHelpdesk';

export const ParentCommunicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'helpdesk' ? 'helpdesk' : 'feeds';

  const switchTab = (tab: 'feeds' | 'helpdesk') => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <PageContainer data-testid="parent-communication-page">
      <PageHeader
        title="Communication"
        description="View published school announcements and feeds or raise inquiries through the school helpdesk."
        badge={
          <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
            School Connect
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/app/parent/notifications')}
              className="rounded-xl gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/app/parent/documents')}
              className="rounded-xl gap-1.5"
            >
              <FolderCheck className="w-3.5 h-3.5" />
              <span>Documents Centre</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          <Button
            size="sm"
            variant={activeTab === 'feeds' ? 'default' : 'outline'}
            onClick={() => switchTab('feeds')}
            className="rounded-xl gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>School Feeds &amp; Announcements</span>
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'helpdesk' ? 'default' : 'outline'}
            onClick={() => switchTab('helpdesk')}
            className="rounded-xl gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Helpdesk &amp; Support Tickets</span>
          </Button>
        </div>

        <div className="rounded-2xl overflow-hidden">
          {activeTab === 'helpdesk' ? <FinanceCommunicationHelpdesk /> : <SocialFeedPage />}
        </div>
      </div>
    </PageContainer>
  );
};

export default ParentCommunicationPage;
