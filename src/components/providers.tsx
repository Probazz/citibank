'use client';
import { SessionProvider } from 'next-auth/react';
import { useIdleLogout } from '@/hooks/use-idle-logout';

function InactivityLogout() {
  useIdleLogout();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InactivityLogout />
      {children}
    </SessionProvider>
  );
}