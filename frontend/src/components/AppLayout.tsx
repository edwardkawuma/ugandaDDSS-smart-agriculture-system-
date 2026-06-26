import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MobileHeader } from '@/components/Sidebar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SyncStatusBadge } from '@/components/SyncStatusBadge';

interface AppLayoutProps {
  children?: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    // Root canvas: dot-grid background fills the full viewport
    <div className="flex h-screen overflow-hidden app-bg">
      {/* Desktop: floating glass panel sidebar (hidden on mobile) */}
      <Sidebar />

      {/* Right side: mobile header + scrollable content on the open canvas */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile-only sticky top bar with hamburger + Sheet drawer */}
        <MobileHeader />

        <div className="hidden border-b border-border/40 px-4 py-1.5 md:flex md:items-center md:justify-end md:px-5">
          <SyncStatusBadge />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 md:pl-4 md:pr-5 md:py-5">
          <ErrorBoundary catchAsyncErrors>
            {children ?? <Outlet />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
