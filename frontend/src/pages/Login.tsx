import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, Loader2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { loginService } from '@/lib/api/loginService';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from '@/lib/toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const DEMO_ROLES = [
    { role: 'Farmer', email: 'farmer@demo.com' },
    { role: 'Extension Worker', email: 'extensionworker@demo.com' },
    { role: 'Researcher', email: 'researcher@demo.com' },
    { role: 'MAAIF Official', email: 'maaifofficial@demo.com' },
    { role: 'Development Partner', email: 'developmentpartner@demo.com' },
    { role: 'Public Visitor', email: 'publicvisitor@demo.com' },
  ];

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await loginService.signIn(data as { email: string; password: string; });
      if (response?.token) {
        const userData = {
          user_id: response.user_id,
          email: response.email,
          name: response.name || '',
          is_email_verified: response.is_email_verified ?? 1,
          role: response.role,
        };
        login(response.token, userData);
        localStorage.removeItem('demo_current_role');
        // If email not verified, redirect to OTP verification
        if (response.is_email_verified === 0) {
          navigate('/verify-otp', { state: { email: data.email, name: userData.name } });
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden app-bg">
      {/* Animated gradient-mesh blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="auth-blob-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div
          className="auth-blob-2 absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-[130px]"
          style={{ background: 'hsl(var(--teal) / 0.18)' }}
        />
        <div className="auth-blob-3 absolute top-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-accent/35 blur-[90px]" />
      </div>

      {/* Fixed controls */}
      <Link
        to="/"
        className="fixed left-5 top-5 z-50 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
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
          <h1 className="font-heading text-4xl font-semibold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-12 text-base bg-background/70 backdrop-blur-sm border-border/60 focus:border-primary/70 pr-11"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="outline"
            className="w-full h-12 text-base mt-2 border-primary text-primary bg-transparent shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_24px_hsl(var(--primary)/0.6)] transition-all duration-200 font-medium"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <div className="mt-6 p-3 rounded-md bg-muted border border-border text-sm">
          <p className="font-medium mb-2 text-muted-foreground">Demo Credentials</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ROLES.map(({ role, email }) => (
              <Button
                key={role}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.setItem('demo_current_role', role);
                  setValue('email', email);
                  setValue('password', 'Demo@1234');
                }}
                className="text-xs h-7 px-2"
              >
                {role}
              </Button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
