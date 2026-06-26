import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPasswordService } from '@/lib/api/forgotPasswordService';
import ThemeToggle from '@/components/ThemeToggle';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});
type FormData = z.infer<typeof schema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await forgotPasswordService.forgotPassword({ email: data.email! });
      // Always navigate — backend is anti-enumeration
      navigate('/verify-reset-otp', { state: { email: data.email } });
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
        <div className="auth-blob-3 absolute -top-40 left-1/4 w-[550px] h-[550px] rounded-full bg-primary/18 blur-[110px]" />
        <div
          className="auth-blob-1 absolute -bottom-32 -right-32 w-[650px] h-[650px] rounded-full blur-[130px]"
          style={{ background: 'hsl(var(--teal) / 0.16)' }}
        />
        <div className="auth-blob-2 absolute top-2/3 left-0 w-[400px] h-[400px] rounded-full bg-accent/30 blur-[80px]" />
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
          <h1 className="font-heading text-4xl font-semibold text-foreground mb-2">Forgot password?</h1>
          <p className="text-muted-foreground text-sm text-center">
            Enter your email and we'll send you a code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 text-base bg-background/70 backdrop-blur-sm border-border/60 focus:border-primary/70"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="outline"
            className="w-full h-12 text-base border-primary text-primary bg-transparent shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_24px_hsl(var(--primary)/0.6)] transition-all duration-200 font-medium"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset code
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Remembered your password?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
