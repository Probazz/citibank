'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

const IDLE_TIMEOUT_MS = 2 * 60 * 1000;
const LOGIN_PATH = '/auth/login';
const LAST_ACTIVITY_KEY = 'citi-last-activity';

export function useIdleLogout() {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }
    if (status !== 'authenticated') return;

    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let hiddenAt: number | null = document.hidden ? Date.now() : null;
    let isSigningOut = false;

    const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const lastActivity = storedLastActivity === null ? null : Number(storedLastActivity);
    if (lastActivity !== null && Number.isFinite(lastActivity) && Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      void signOut({ callbackUrl: LOGIN_PATH });
      return;
    }

    const logout = () => {
      if (isSigningOut) return;
      isSigningOut = true;
      void signOut({ callbackUrl: LOGIN_PATH });
    };

    const resetIdleTimer = () => {
      if (document.hidden || isSigningOut) return;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(logout, IDLE_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        if (idleTimer) clearTimeout(idleTimer);
        return;
      }

      if (hiddenAt !== null && Date.now() - hiddenAt >= IDLE_TIMEOUT_MS) {
        logout();
        return;
      }

      hiddenAt = null;
      resetIdleTimer();
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
    ];

    activityEvents.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetIdleTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);
}