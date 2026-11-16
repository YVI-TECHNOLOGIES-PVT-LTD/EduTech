import React from 'react';
import { SocialFeedPage } from '../../communication/pages/SocialFeedPage';

/**
 * FinanceCommunicationFeeds / School Community Feeds Route Component
 * Transformed into a modern social-media-style feed (Phase 18.4)
 * Supporting both /app/communication/feeds (Parent/Student/School Community)
 * and /app/finance/communication/feeds (Administrative & Staff feeds).
 */
export const FinanceCommunicationFeeds: React.FC = () => {
  return <SocialFeedPage />;
};

export default FinanceCommunicationFeeds;
