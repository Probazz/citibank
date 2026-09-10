'use client';
import { signOut, SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

function InactivityLogout() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        void signOut({ callbackUrl: '/auth/login' });
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    activityEvents.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [status]);

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