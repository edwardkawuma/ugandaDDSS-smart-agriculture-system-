import { useState } from 'react';
import { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import {
  Leaf,
  Menu,
  X,
  Map,
  BookOpen,
  Info,
  CalendarDays,
} from 'lucide-react';

interface PublicLayoutProps {
  children?: ReactNode;
}

const publicNavLinks = [
  { label: 'Public Maps', href: '/public-maps', icon: Map },
  { label: 'Agricultural Information', href: '/agricultural-information', icon: Info },
  { label: 'Seasonal Calendars', href: '/seasonal-calendars', icon: CalendarDays },
];

/**
 * Public marketing shell wrapping every unauthenticated-facing route (the
 * Landing page at `/` plus any other marketing pages). The header ALWAYS exposes
 * the auth entry points — "Log in" / "Sign up" for anonymous visitors, or a
 * "Dashboard" link once authenticated — so the landing page is never a dead
 * end and a logged-in user can always get back into the app.
 */
const PublicLayout = ({ children }: PublicLayoutProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex min-h-screen flex-col bg-background app-bg">
      {/* ── Glassmorphic top navigation ── */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 pt-3 md:px-6">
          <div className="flex h-14 items-center justify-between rounded-2xl backdrop-blur-2xl backdrop-saturate-150 bg-card/55 border border-border/40 shadow-lg ring-1 ring-inset ring-white/10 px-4 md:px-5">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center transition-all group-hover:bg-primary/30">
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <div className="leading-none">
                <span className="font-heading font-bold text-foreground text-base block">
                  AgriWatch
                </span>
                <span className="text-[10px] text-primary/70 font-sans tracking-widest uppercase">
                  Uganda
                </span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive(link.href)
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/8'
                  )}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth CTAs + mobile hamburger */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Link to="/">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                    <Link to="/login">Log in</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="border border-primary text-primary bg-transparent shadow-[0_0_12px_rgba(var(--primary-rgb,201,157,51),0.3)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb,201,157,51),0.5)] hover:bg-primary/10 transition-all duration-200"
                  >
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-1 rounded-2xl backdrop-blur-2xl backdrop-saturate-150 bg-card/80 border border-border/40 shadow-lg px-3 py-3 space-y-1">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive(link.href)
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/8'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all duration-200"
                >
                  Log in
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <ErrorBoundary catchAsyncErrors>
          {children ?? <Outlet />}
        </ErrorBoundary>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm py-8 mt-auto">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Leaf className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="leading-none">
                <span className="font-heading font-bold text-foreground text-sm block">
                  AgriWatch Uganda
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Climate-Smart Agricultural Intelligence
                </span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
            </nav>

            <p className="text-xs text-muted-foreground text-center md:text-right">
              © {new Date().getFullYear()} AgriWatch Uganda. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
