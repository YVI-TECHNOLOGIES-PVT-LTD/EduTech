import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { TrustMetrics } from '../components/TrustMetrics';
import { WhyEduTrack } from '../components/WhyEduTrack';
import { AcademicExperience } from '../components/AcademicExperience';
import { AdmissionJourney } from '../components/AdmissionJourney';
import { CampusExperience } from '../components/CampusExperience';
import { ParentTestimonials } from '../components/ParentTestimonials';
import { FinalAdmissionCTA } from '../components/FinalAdmissionCTA';

interface PublicLayoutContext {
  onOpenEnquiry?: () => void;
  onOpenEduAI?: () => void;
}

export const LandingPage: React.FC = () => {
  const context = useOutletContext<PublicLayoutContext>();
  const handleOpenEnquiry = context?.onOpenEnquiry;
  const handleOpenEduAI = context?.onOpenEduAI;

  return (
    <div className="flex-1 flex flex-col overflow-x-hidden">
      {/* 1. Hero Section (In dark navy top header container) */}
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white relative">
        <HeroSection onStartAdmissionClick={handleOpenEnquiry} />
      </div>

      {/* 2. Trust Metrics Horizontal Strip */}
      <TrustMetrics />

      {/* 3. Why Choose EduTrack */}
      <WhyEduTrack />

      {/* 4. Learning at EduTrack (Tabbed Academic Experience) */}
      <AcademicExperience />

      {/* 5. Admission Journey (7 Conceptual Steps) */}
      <AdmissionJourney onEnquireClick={handleOpenEnquiry} />

      {/* 6. Campus Experience (Filtered Media Gallery) */}
      <CampusExperience />

      {/* 7. Testimonials Carousel */}
      <ParentTestimonials />

      {/* 8. Final Conversion CTA */}
      <FinalAdmissionCTA
        onStartAdmissionClick={handleOpenEnquiry}
        onTalkToEduAIClick={handleOpenEduAI}
      />
    </div>
  );
};

export default LandingPage;
