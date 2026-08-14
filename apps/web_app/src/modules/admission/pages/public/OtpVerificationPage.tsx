import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { KeyRound, Loader2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdmissionShell } from '../../components/AdmissionShell';
import { admissionApi } from '@/modules/admission/admission.api';

export const OtpVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!email && !phone) {
    return <Navigate to="/admission/register" replace />;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error('Please enter a valid OTP code');
      return;
    }
    setIsLoading(true);
    try {
      await admissionApi.verifyOtp({ email, phone, otp });
      toast.success('Account verified successfully!');
      navigate('/admission/register/success');
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Invalid or expired OTP. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setCooldown(60);
    toast.success(`Verification code resent to ${email || phone}`);
  };

  return (
    <AdmissionShell
      title="Verify Mobile & Email"
      subtitle={`Enter the 6-digit verification code sent to ${phone || email}`}
    >
      <form onSubmit={handleVerify} className="space-y-6 max-w-md mx-auto text-center">
        <div className="w-14 h-14 bg-[#063F40] text-[#E7B76A] rounded-2xl flex items-center justify-center mx-auto border border-[#E7B76A]/20 shadow-md">
          <KeyRound className="w-6 h-6 text-[#E7B76A]" />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider">
            6-DIGIT VERIFICATION CODE
          </label>
          <Input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoFocus
            className="text-center text-2xl font-mono font-bold tracking-[0.4em] h-13 rounded-xl border-border/80 text-foreground focus-visible:border-[#063F40]"
            maxLength={6}
          />
          <p className="text-[11px] text-muted-foreground flex items-center justify-center space-x-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#063F40]" />
            <span>Code expires in 10 minutes</span>
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-[#E7B76A] hover:bg-[#d8a658] text-[#042A2B] font-extrabold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#042A2B]" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4 text-[#042A2B]" />
            </>
          )}
        </Button>

        <div className="pt-2 text-xs text-muted-foreground font-medium">
          {cooldown > 0 ? (
            <p>
              Resend code in{' '}
              <strong className="text-foreground font-mono">
                00:{cooldown.toString().padStart(2, '0')}
              </strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center space-x-1.5 font-bold text-[#063F40] dark:text-[#E7B76A] hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend Verification Code</span>
            </button>
          )}
        </div>
      </form>
    </AdmissionShell>
  );
};

export default OtpVerificationPage;
