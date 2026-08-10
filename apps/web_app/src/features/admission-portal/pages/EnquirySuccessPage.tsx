import React, { useState, useEffect } from 'react';
import { AdmissionShell } from '../components/AdmissionShell';
import { AdmissionStatusCard } from '../components/AdmissionStatusCard';

export const EnquirySuccessPage: React.FC = () => {
  const [enquiryId, setEnquiryId] = useState('ENQ-2026-ACCEPTED');

  useEffect(() => {
    const session = sessionStorage.getItem('edutrack_enquiry_session');
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.referenceId) setEnquiryId(data.referenceId);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  return (
    <AdmissionShell
      currentStep="enquiry"
      title="Enquiry Confirmation"
      subtitle="Your enquiry has been logged into our admissions system."
      badgeText="Enquiry Received"
    >
      <AdmissionStatusCard
        title="Enquiry Received Successfully!"
        subtitle="Thank you for your interest in EduTrack. Our admissions team will get in touch with your family shortly."
        referenceLabel="Enquiry Reference Code"
        referenceValue={enquiryId}
        statusBadge="Logged & Assigned"
        nextSteps={[
          'Our admissions counseling desk reviews your enquiry details.',
          'You will receive a call or email from your assigned counselor within 24 hours.',
          'You may create a parent account to proceed with formal registration anytime.',
        ]}
        primaryCtaText="Proceed to Account Registration"
        primaryCtaLink="/admission/register"
        secondaryCtaText="Back to Home"
        secondaryCtaLink="/"
      />
    </AdmissionShell>
  );
};

export default EnquirySuccessPage;
