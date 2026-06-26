import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPasswordService } from '@/lib/api/resetPasswordService';
import ThemeToggle from '@/components/ThemeToggle';

const schema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const reset_token: string = location.state?.reset_token ?? '';

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reset_token) navigate('/forgot-password');
  }, [reset_token, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await resetPasswordService.resetPassword({ reset_token, newPassword: data.newPassword });
      navigate('/login');
    } catch {
      // error toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden app-bg">
      {/* Animated gradient-mesh blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="auth-blob-1 absolute -top-32 right-1/4 w-[550px] h-[550px] rounded-full bg-primary/20 blur-[110px]" />
        <div
          className="auth-blob-2 absolute -bottom-40 -left-32 w-[650px] h-[650px] rounded-full blur-[130px]"
          style={{ background: 'hsl(var(--teal) / 0.17)' }}
        />
        <div className="auth-blob-3 absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-accent/30 blur-[80px]" />
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
          <h1 className="font-heading text-4xl font-semibold text-foreground mb-2">Set new password</h1>
          <p className="text-muted-foreground text-sm">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium">New password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className="h-12 text-base bg-background/70 backdrop-blur-sm border-border/60 focus:border-primary/70 pr-11"
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                className="h-12 text-base bg-background/70 backdrop-blur-sm border-border/60 focus:border-primary/70 pr-11"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="outline"
            className="w-full h-12 text-base border-primary text-primary bg-transparent shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_24px_hsl(var(--primary)/0.6)] transition-all duration-200 font-medium"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset password
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
