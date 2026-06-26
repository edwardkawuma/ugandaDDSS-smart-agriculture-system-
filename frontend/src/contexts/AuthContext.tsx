import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/constants/Storagekey';

interface AuthUser {
  user_id: string;
  email: string;
  name: string;
  is_email_verified: number;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    // In mock/preview mode the demo-credentials buttons stash the exact role
    // label (e.g. "Finance/Procurement") in `demo_current_role`. The mock
    // signin can only derive a role from the email local part, which silently
    // drops slashes/spaces ("financeprocurement"), so a multi-word role never
    // matches the canonical tokens used by the sidebar / route guards and the
    // page renders blank. Treat the demo role as authoritative — but ONLY under
    // VITE_USE_MOCK, so a stale localStorage value can never override the real
    // backend's role claim in production.
    const demoRole =
      import.meta.env.VITE_USE_MOCK === 'true'
        ? localStorage.getItem('demo_current_role') || ''
        : '';
    const userWithRole: AuthUser = demoRole ? { ...newUser, role: demoRole } : newUser;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithRole));
    setToken(newToken);
    setUser(userWithRole);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('demo_current_role');
    setToken(null);
    setUser(null);
    // Land on the public landing page ('/'). For dual-surface apps this is the marketing Landing;
    // for pure-dashboard apps with no landing, '/' falls through to the login redirect anyway.
    window.location.href = '/';
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    setUser(updated);
  };

  // Role-based gate. `permission` is treated as a role label or a comma-
  // separated list of acceptable roles. Empty string / falsy permission ==
  // "any authenticated user". Matching is case-insensitive so the JWT's
  // `role` claim (whatever case the backend stored) lines up with route
  // declarations like `requiredPermission="Admin"`.
  //
  // When `user.role` is missing (older sessions, mock-signin responses that
  // forgot the claim) we derive a role from the email's local part — e.g.
  // `manager@demo.com` → `manager`. This is what keeps protected pages from
  // silently rendering blank when ProtectedRoute's role check fires too
  // early; it also lines up with the convention used by the demo-credentials
  // injector and the mock auth handler.
  const hasPermission = (permission: string): boolean => {
    if (!token || !user) return false;
    if (!permission) return true;
    let userRole = (user.role ?? '').toLowerCase();
    if (!userRole && user.email) {
      userRole = (user.email.split('@')[0] ?? '').toLowerCase().replace(/\d+$/, '');
    }
    if (!userRole) return false;
    const allowed = permission.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
    return allowed.includes(userRole);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, updateUser, hasPermission }}>
      {isLoading ? (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="h-8 w-8 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
