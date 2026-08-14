import React, { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { KeyRound, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
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
      toast.error(err?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdmissionShell
      title="Verify Account OTP"
      subtitle={`Enter OTP code sent to ${email || phone}`}
    >
      <form onSubmit={handleVerify} className="space-y-5 max-w-md mx-auto text-center">
        <div className="w-12 h-12 bg-[#063F40] text-[#E7B76A] rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/10 shadow-xs">
          <KeyRound className="w-5 h-5 text-[#E7B76A]" />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-2">
            Verification Code
          </label>
          <Input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="text-center text-lg font-mono tracking-widest h-11 rounded-xl border-border/80 text-foreground focus-visible:border-[#063F40]"
            maxLength={6}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-[#063F40] hover:bg-[#082F35] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#E7B76A]" />
          ) : (
            <span className="text-[#E7B76A]">Verify & Continue</span>
          )}
          <ArrowRight className="w-3.5 h-3.5 text-[#E7B76A]" />
        </Button>
      </form>
    </AdmissionShell>
  );
};

export default OtpVerificationPage;
