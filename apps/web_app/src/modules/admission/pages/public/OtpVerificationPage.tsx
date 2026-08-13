import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
      currentStep="otp"
      title="Verify Mobile / Email"
      subtitle={`Enter OTP code sent to ${email || phone}`}
    >
      <form onSubmit={handleVerify} className="space-y-6 max-w-md mx-auto text-center">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Verification Code
          </label>
          <Input
            type="text"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="text-center text-lg font-mono tracking-widest h-12 rounded-xl"
            maxLength={6}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Verify & Continue</span>
          )}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </AdmissionShell>
  );
};

export default OtpVerificationPage;
