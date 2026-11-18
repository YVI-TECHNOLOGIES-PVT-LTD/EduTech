import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import {
  KeyRound,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/modules/auth/components/AuthLayout';
import { admissionApi } from '@/modules/admission/admission.api';
import { cn } from '@/lib/utils';

export const OtpVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const navigate = useNavigate();

  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [lastEnteredIndex, setLastEnteredIndex] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Focus first empty slot on initial mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  if (!email && !phone) {
    return <Navigate to="/admission/register" replace />;
  }

  const otpString = otpValues.join('');

  // Primary verification dispatcher
  const handleVerify = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    if (isLoading || isSuccess) return;

    const code = (overrideCode ?? otpValues.join('')).trim();
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit verification code');
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
      await admissionApi.verifyOtp({ email, phone, otp: code });
      setIsSuccess(true);
      toast.success('Account verified successfully!');
      setTimeout(() => {
        navigate('/admission/register/success');
      }, 450);
    } catch (err: any) {
      setIsError(true);
      const errMsg =
        err?.data?.error ||
        err?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Invalid or expired verification code. Please try again.';
      toast.error(errMsg);

      // Trigger shake animation and refocus first slot
      setTimeout(() => {
        setIsError(false);
        inputRefs.current[0]?.focus();
        inputRefs.current[0]?.select();
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // Seamless digit typing with instant overwrite support
  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '');

    // Case 1: User deleted or backspaced to empty
    if (!digitsOnly) {
      const newOtp = [...otpValues];
      newOtp[index] = '';
      setOtpValues(newOtp);
      return;
    }

    // Case 2: Exactly 1 digit entered
    if (digitsOnly.length === 1) {
      const newOtp = [...otpValues];
      newOtp[index] = digitsOnly;
      setOtpValues(newOtp);
      setLastEnteredIndex(index);

      // Advance focus to next input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }

      // If full 6 digits are completed, auto-trigger verification
      const fullCode = newOtp.join('');
      if (fullCode.length === 6 && !newOtp.includes('')) {
        setTimeout(() => {
          handleVerify(undefined, fullCode);
        }, 180);
      }
      return;
    }

    // Case 3: 2 digits (User typed directly into an already-filled box)
    if (digitsOnly.length === 2) {
      const prevVal = otpValues[index];
      // Pick the newly typed digit
      const nextChar = digitsOnly[1] !== prevVal ? digitsOnly[1] : digitsOnly[0];

      const newOtp = [...otpValues];
      newOtp[index] = nextChar;
      setOtpValues(newOtp);
      setLastEnteredIndex(index);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }

      const fullCode = newOtp.join('');
      if (fullCode.length === 6 && !newOtp.includes('')) {
        setTimeout(() => {
          handleVerify(undefined, fullCode);
        }, 180);
      }
      return;
    }

    // Case 4: Multi-digit string (paste or autofill)
    handlePasteString(digitsOnly, index);
  };

  // Keyboard navigation & smart backspace handling
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpValues[index]) {
        // Clear current slot
        const newOtp = [...otpValues];
        newOtp[index] = '';
        setOtpValues(newOtp);
      } else if (index > 0) {
        // Current slot is already empty: step back, clear previous slot, and focus it
        const newOtp = [...otpValues];
        newOtp[index - 1] = '';
        setOtpValues(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
        inputRefs.current[index + 1]?.select();
      }
      return;
    }

    if (e.key === 'Delete') {
      if (otpValues[index]) {
        const newOtp = [...otpValues];
        newOtp[index] = '';
        setOtpValues(newOtp);
      }
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    }
  };

  // Paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    handlePasteString(pastedData, focusedIndex ?? 0);
  };

  const handlePasteString = (data: string, startIndex = 0) => {
    const numbersOnly = data.replace(/\D/g, '').slice(0, 6);
    if (!numbersOnly) return;

    const newOtp = [...otpValues];
    const start = numbersOnly.length === 6 ? 0 : startIndex;

    for (let i = 0; i < numbersOnly.length && start + i < 6; i++) {
      newOtp[start + i] = numbersOnly[i];
    }

    setOtpValues(newOtp);
    setLastEnteredIndex(Math.min(start + numbersOnly.length - 1, 5));

    const nextIndex = Math.min(start + numbersOnly.length, 5);
    inputRefs.current[nextIndex]?.focus();

    const fullCode = newOtp.join('');
    if (fullCode.length === 6 && !newOtp.includes('')) {
      setTimeout(() => {
        handleVerify(undefined, fullCode);
      }, 180);
    }
  };

  const handleFocus = (index: number, e: React.FocusEvent<HTMLInputElement>) => {
    setFocusedIndex(index);
    e.target.select();
  };

  const handleResend = () => {
    setCooldown(60);
    setOtpValues(['', '', '', '', '', '']);
    setIsError(false);
    setIsSuccess(false);
    inputRefs.current[0]?.focus();
    toast.success(`New verification code sent to ${phone || email}`);
  };

  // Mask registered phone or email for privacy
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
      <form onSubmit={(e) => handleVerify(e)} className="space-y-6">
        {/* Verification Icon Header */}
        <div className="text-center space-y-3">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border transition-all duration-300 shadow-xs',
              isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-600 scale-105'
                : isError
                  ? 'bg-destructive/10 border-destructive/30 text-destructive animate-otp-shake'
                  : 'bg-muted/60 text-[#063F40] dark:text-[#E7B76A] border-[#063F40]/20 dark:border-[#E7B76A]/20',
            )}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-200" />
            ) : (
              <KeyRound className="w-6 h-6 transition-transform" />
            )}
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

          <div
            className={cn(
              'flex justify-center items-center gap-2 sm:gap-3.5 py-1 transition-transform',
              isError && 'animate-otp-shake',
            )}
            onPaste={handlePaste}
          >
            {otpValues.map((val, idx) => {
              const isFocused = focusedIndex === idx;
              const isFilled = Boolean(val);
              const isJustEntered = lastEnteredIndex === idx;

              return (
                <div key={idx} className="relative group">
                  <input
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onFocus={(e) => handleFocus(idx, e)}
                    onBlur={() => setFocusedIndex(null)}
                    aria-label={`Digit ${idx + 1}`}
                    disabled={isLoading || isSuccess}
                    className={cn(
                      'w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-extrabold font-mono rounded-2xl border-2 transition-all duration-200 select-none outline-none',
                      // Default state
                      'bg-card text-foreground border-border/80 shadow-xs',
                      // Hover
                      'hover:border-foreground/30',
                      // Focused state with luxury brand glow
                      isFocused &&
                        'border-[#063F40] dark:border-[#E7B76A] ring-4 ring-[#063F40]/15 dark:ring-[#E7B76A]/20 scale-105 shadow-md bg-card z-10',
                      // Filled state
                      isFilled &&
                        !isFocused &&
                        'border-[#063F40]/45 dark:border-[#E7B76A]/55 bg-[#063F40]/5 dark:bg-[#E7B76A]/10 text-foreground',
                      // Error shake state
                      isError &&
                        'border-destructive ring-4 ring-destructive/20 bg-destructive/10 text-destructive',
                      // Success state
                      isSuccess &&
                        'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-4 ring-emerald-500/20 scale-105',
                      // Pop micro-bounce on digit entry
                      isJustEntered && isFilled && 'animate-otp-pop',
                    )}
                  />

                  {/* Pulsing indicator under empty focused slot */}
                  {isFocused && !val && !isError && (
                    <span className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#063F40] dark:bg-[#E7B76A] rounded-full animate-pulse pointer-events-none" />
                  )}

                  {/* Subtle completed corner accent */}
                  {isFilled && !isFocused && !isError && !isSuccess && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#063F40]/60 dark:bg-[#E7B76A]/70 pointer-events-none animate-in fade-in zoom-in duration-150" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center justify-center space-x-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#063F40] dark:text-[#E7B76A]" />
            <span>Code valid for 10 minutes &bull; Single use</span>
          </p>
        </div>

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          disabled={isLoading || isSuccess || otpString.length < 6}
          className={cn(
            'w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] active:scale-[0.98] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed',
            otpString.length === 6 &&
              !isLoading &&
              !isSuccess &&
              'ring-4 ring-[#E7B76A]/30 scale-[1.01] shadow-lg animate-pulse-slow',
            isSuccess && 'bg-emerald-600 hover:bg-emerald-600 text-white shadow-emerald-500/30',
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#042A2B]" />
              <span>Verifying Code...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white animate-in zoom-in duration-200" />
              <span>Verified Successfully!</span>
            </>
          ) : (
            <>
              <span>Verify &amp; Continue</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
