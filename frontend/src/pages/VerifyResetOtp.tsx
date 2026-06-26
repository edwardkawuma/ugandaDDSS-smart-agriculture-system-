import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { verifyResetOtpService } from '@/lib/api/verifyResetOtpService';
import { toast } from '@/lib/toast';
import ThemeToggle from '@/components/ThemeToggle';

const VerifyResetOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email: string = location.state?.email ?? '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyResetOtpService.verifyResetOtp({ email, otp });
      if (response?.reset_token) {
        navigate('/reset-password', { state: { reset_token: response.reset_token } });
      }
    } catch {
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await verifyResetOtpService.resendResetOtp(email);
      setCooldown(60);
    } catch {
      // error toast handled by interceptor
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden app-bg">
      {/* Animated gradient-mesh blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="auth-blob-2 absolute -top-32 -right-32 w-[580px] h-[580px] rounded-full bg-primary/18 blur-[115px]" />
        <div
          className="auth-blob-3 absolute -bottom-40 left-1/4 w-[650px] h-[650px] rounded-full blur-[130px]"
          style={{ background: 'hsl(var(--teal) / 0.16)' }}
        />
        <div className="auth-blob-1 absolute top-1/3 right-1/3 w-[400px] h-[400px] rounded-full bg-accent/30 blur-[80px]" />
      </div>

      {/* Fixed controls */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Centered form — floats directly on mesh, no card chrome */}
      <div className="relative z-10 w-full max-w-sm px-8 py-12 animate-fade-in">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-5 shadow-[0_0_24px_hsl(var(--primary)/0.3)]">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-semibold text-foreground mb-2">Enter reset code</h1>
          <p className="text-muted-foreground text-sm text-center">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-base border-primary text-primary bg-transparent shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_24px_hsl(var(--primary)/0.6)] transition-all duration-200 font-medium"
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify code
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            {cooldown > 0 ? (
              <span className="text-muted-foreground">Resend in {cooldown}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary hover:underline font-medium disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Back
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetOtp;
