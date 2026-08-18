import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { KeyRound, Loader2, ArrowRight, ShieldCheck, RefreshCw, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/modules/auth/components/AuthLayout';
import { admissionApi } from '@/modules/admission/admission.api';

export const OtpVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const navigate = useNavigate();

  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  if (!email && !phone) {
    return <Navigate to="/admission/register" replace />;
  }

  const otpString = otpValues.join('');

  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric characters
    const sanitized = value.replace(/[^0-9]/g, '');

    if (!sanitized) {
      const newOtp = [...otpValues];
      newOtp[index] = '';
      setOtpValues(newOtp);
      return;
    }

    if (sanitized.length === 1) {
      const newOtp = [...otpValues];
      newOtp[index] = sanitized;
      setOtpValues(newOtp);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (sanitized.length > 1) {
      // Handle paste
      handlePasteString(sanitized);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    handlePasteString(pastedData);
  };

  const handlePasteString = (data: string) => {
    const numbersOnly = data.replace(/[^0-9]/g, '').slice(0, 6);
    if (!numbersOnly) return;
    const newOtp = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = numbersOnly[i] || '';
    }
    setOtpValues(newOtp);
    const nextIndex = Math.min(numbersOnly.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpString.length < 6) {
      toast.error('Please enter the full 6-digit verification code');
      return;
    }
    setIsLoading(true);
    try {
      await admissionApi.verifyOtp({ email, phone, otp: otpString });
      toast.success('Account verified successfully!');
      navigate('/admission/register/success');
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Invalid or expired OTP. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setCooldown(60);
    setOtpValues(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    toast.success(`New verification code sent to ${email || phone}`);
  };

  const maskedTarget = phone
    ? phone.replace(/(\d{2})(\d+)(\d{2})/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`)
    : email.replace(
        /(.{2})(.*)(@.*)/,
        (_, a, b, c) => `${a}${'*'.repeat(Math.max(b.length, 3))}${c}`,
      );

  return (
    <AuthLayout
      badgeText="Identity Verification"
      title="Verify Your Account"
      subtitle="Enter the 6-digit verification code sent to your registered contact"
      backTo={{ label: 'Back to Registration', href: '/admission/register' }}
    >
      <form onSubmit={handleVerify} className="space-y-6">
        {/* Verification Icon Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-editorial-cream text-[#063F40] rounded-2xl flex items-center justify-center mx-auto border border-[#063F40]/20 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>

          <div className="p-3 bg-muted/40 rounded-2xl border border-border/80 inline-flex items-center space-x-2 text-xs font-semibold text-foreground">
            {phone ? (
              <Phone className="w-3.5 h-3.5 text-[#063F40] dark:text-[#E7B76A] shrink-0" />
            ) : (
              <Mail className="w-3.5 h-3.5 text-[#063F40] dark:text-[#E7B76A] shrink-0" />
            )}
            <span>
              Code sent to: <strong className="text-foreground font-mono">{maskedTarget}</strong>
            </span>
          </div>
        </div>

        {/* 6-DIGIT SEGMENTED OTP INPUT */}
        <div className="space-y-3">
          <label className="block text-center text-xs font-bold text-foreground uppercase tracking-wider">
            6-Digit Verification Code
          </label>

          <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={val}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                aria-label={`Digit ${idx + 1}`}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold font-mono rounded-xl border border-border/80 bg-card text-foreground shadow-xs focus:border-[#063F40] focus:ring-2 focus:ring-[#063F40]/20 dark:focus:border-[#E7B76A] dark:focus:ring-[#E7B76A]/20 focus:outline-none transition-all"
              />
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center justify-center space-x-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#063F40] dark:text-[#E7B76A]" />
            <span>Code valid for 10 minutes &bull; Single use</span>
          </p>
        </div>

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          disabled={isLoading || otpString.length < 6}
          className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#042A2B]" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {/* RESEND TIMER & ACTION */}
        <div className="text-center pt-2">
          {cooldown > 0 ? (
            <p className="text-xs text-muted-foreground font-medium">
              Didn&apos;t receive code? Resend available in{' '}
              <strong className="text-foreground font-mono font-bold">
                00:{cooldown.toString().padStart(2, '0')}
              </strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center space-x-1.5 text-xs font-extrabold text-[#063F40] dark:text-[#E7B76A] hover:underline transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend Verification Code</span>
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};

export default OtpVerificationPage;
