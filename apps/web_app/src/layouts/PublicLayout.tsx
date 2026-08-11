import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AnnouncementBar } from '@/features/landing/components/AnnouncementBar';
import { Navbar } from '@/features/landing/components/Navbar';
import { Footer } from '@/features/landing/components/Footer';
import { EduAIAssistant } from '@/features/landing/components/EduAIAssistant';

export function PublicLayout() {
  const navigate = useNavigate();
  const [isEduAIOpen, setIsEduAIOpen] = useState(false);

  const handleOpenEnquiry = () => navigate('/enquiry');

  const handleOpenEduAI = () => setIsEduAIOpen(true);
  const handleCloseEduAI = () => setIsEduAIOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col overflow-x-hidden relative">
      {/* Canonical Top Announcement & Floating Pill Navbar Shell */}
      <div className="bg-slate-950 text-white relative z-40">
        <AnnouncementBar onApplyClick={handleOpenEnquiry} />
        <Navbar onEnquireClick={handleOpenEnquiry} />
      </div>

      {/* Main Page Route Content */}
      <main className="flex-1 flex flex-col">
        <Outlet context={{ onOpenEnquiry: handleOpenEnquiry, onOpenEduAI: handleOpenEduAI }} />
      </main>

      {/* Canonical Footer */}
      <Footer />

      {/* Global Floating EduAI Assistant Concierge */}
      <EduAIAssistant isOpen={isEduAIOpen} onOpen={handleOpenEduAI} onClose={handleCloseEduAI} />
    </div>
  );
}

export default PublicLayout;
