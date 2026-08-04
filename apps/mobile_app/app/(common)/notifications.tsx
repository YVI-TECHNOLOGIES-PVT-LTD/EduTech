import React from 'react';
import { ScreenWrapper } from '../../src/components/ui/templates/ScreenWrapper';
import { SectionHeader } from '../../src/components/ui/molecules/SectionHeader';
import { EmptyState } from '../../src/components/ui/organisms/EmptyState';

export default function NotificationsScreen() {
  return (
    <ScreenWrapper scrollable padded>
      <SectionHeader title="Notifications" subtitle="In-app alerts and announcements" />
      <EmptyState title="No Notifications" description="You have no unread notifications or alerts." />
    </ScreenWrapper>
  );
}
