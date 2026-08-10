import React, { useState, useEffect } from 'react';
import { AdmissionShell } from '../components/AdmissionShell';
import { AdmissionStatusCard } from '../components/AdmissionStatusCard';

export const RegistrationSuccessPage: React.FC = () => {
  const [registrationId, setRegistrationId] = useState('REG-2026-ACCEPTED');

  useEffect(() => {
    const verified = sessionStorage.getItem('edutrack_verified_registration');
    const session = sessionStorage.getItem('edutrack_registration_session');

    if (verified) {
      try {
        const data = JSON.parse(verified);
        if (data.registrationId) setRegistrationId(data.registrationId);
      } catch (e) {
        // Fallback
      }
    } else if (session) {
      try {
        const data = JSON.parse(session);
        if (data.registrationId) setRegistrationId(data.registrationId);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  return (
    <AdmissionShell
      currentStep="success"
      title="Registration Complete"
      subtitle="Your parent portal account is verified and active."
      badgeText="Account Activated"
    >
      <AdmissionStatusCard
        title="Registration Successful!"
        subtitle="Your parent portal account has been created and verified successfully."
        referenceLabel="Registration Account Reference"
        referenceValue={registrationId}
        statusBadge="Active & Verified"
        nextSteps={[
          'Your account is enabled for single sign-on access.',
          'Sign in with your email and password to access student applications.',
          'Explore grade capacity, documentation checklists, and fee schedules.',
        ]}
        primaryCtaText="Sign In to Portal"
        primaryCtaLink="/login"
        secondaryCtaText="Back to Home"
        secondaryCtaLink="/"
      />
    </AdmissionShell>
  );
};

export default RegistrationSuccessPage;
