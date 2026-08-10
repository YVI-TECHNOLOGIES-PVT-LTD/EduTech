import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, ArrowRight, ArrowLeft, RefreshCw, Smartphone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AdmissionShell } from '../components/AdmissionShell';
import { OtpInput } from '../components/OtpInput';

export const OtpVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [sessionData, setSessionData] = useState<{
    registrationId?: string;
    email?: string;
    phone?: string;
    parentName?: string;
  } | null>(null);

  useEffect(() => {
    // Retrieve stored registration session
    const stored = sessionStorage.getItem('edutrack_registration_session');
    if (stored) {
      try {
        setSessionData(JSON.parse(stored));
      } catch (e) {
        // Fallback default
        setSessionData({
          registrationId: 'REG-2026-ACCEPTED',
          email: 'parent@example.com',
          phone: '+1 (800) 555-3388',
          parentName: 'Parent Applicant',
        });
      }
    } else {
      setSessionData({
        registrationId: 'REG-2026-ACCEPTED',
        email: 'parent@example.com',
        phone: '+1 (800) 555-3388',
        parentName: 'Parent Applicant',
      });
    }
  }, []);

  // Cooldown timer countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otpValue;
    if (code.length < 6) {
      setHasError(true);
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      // Verification logic: accept valid 6-digit OTP code (e.g. 123456 or any 6 digits in sandbox)
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success('Account Verified Successfully!', {
        description: 'Your parent registration is now active. You may log in to access your portal.',
      });

      // Save verified registration info
      sessionStorage.setItem(
        'edutrack_verified_registration',
        JSON.stringify({
          registrationId: sessionData?.registrationId || 'REG-2026-ACCEPTED',
          email: sessionData?.email || 'parent@example.com',
          parentName: sessionData?.parentName || 'Parent Applicant',
          status: 'ACTIVE',
        })
      );

      navigate('/admission/register/success');
    } catch (err: any) {
      setHasError(true);
      setErrorMessage('Invalid verification code. Please check your code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldownSeconds > 0) return;
    setCooldownSeconds(60);
    setOtpValue('');
    setHasError(false);
    setErrorMessage(null);

    toast.info('New OTP Sent', {
      description: `A new 6-digit verification code has been dispatched to ${sessionData?.email || 'your email'}.`,
    });
  };

  const maskedPhone = sessionData?.phone
    ? sessionData.phone.replace(/.(?=.{4})/g, '*')
    : '********3388';

  return (
    <AdmissionShell
      currentStep="otp"
      title="Verify Account"
      subtitle="Enter the 6-digit verification code sent to your registered mobile and email."
      badgeText="Security Verification"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl shadow-slate-950/5 space-y-7 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-950 flex items-center justify-center mx-auto shadow-sm border border-indigo-100 shrink-0">
          <Smartphone className="w-8 h-8 text-indigo-900" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">
            Verify Your Mobile & Email
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
            We sent a 6-digit security code to{' '}
            <span className="font-bold text-slate-900">{maskedPhone}</span> /{' '}
            <span className="font-bold text-slate-900">{sessionData?.email || 'your email'}</span>.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 max-w-sm mx-auto"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* 6-Digit OTP Input Box */}
        <div className="py-2 space-y-3">
          <OtpInput
            length={6}
            value={otpValue}
            onChange={(val) => {
              setOtpValue(val);
              if (hasError) setHasError(false);
            }}
            onComplete={(val) => handleVerify(val)}
            disabled={isLoading}
            hasError={hasError}
          />
          <p className="text-[11px] text-slate-400">
            Sandbox Tip: Enter any 6 digits (e.g. <span className="font-mono font-bold text-slate-700">123456</span>) to verify.
          </p>
        </div>

        {/* Resend Controls */}
        <div className="space-y-3 pt-2 border-t border-slate-100 max-w-sm mx-auto">
          <div className="text-xs text-slate-500">
            Didn't receive the code?{' '}
            {cooldownSeconds > 0 ? (
              <span className="font-mono font-bold text-indigo-950">
                Resend in {String(Math.floor(cooldownSeconds / 60)).padStart(2, '0')}:
                {String(cooldownSeconds % 60).padStart(2, '0')}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-bold text-indigo-900 hover:text-indigo-700 underline cursor-pointer"
              >
                Resend Code Now
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/admission/register" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm h-12 rounded-full px-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Number
            </Button>
          </Link>

          <Button
            size="lg"
            onClick={() => handleVerify()}
            disabled={isLoading || otpValue.length < 6}
            className="w-full sm:w-auto bg-[#FF6A00] hover:bg-[#e55f00] text-white font-bold text-xs sm:text-sm h-12 rounded-full px-8 shadow-lg shadow-orange-500/25 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying Code...
              </>
            ) : (
              <>
                Verify & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </AdmissionShell>
  );
};

export default OtpVerificationPage;
