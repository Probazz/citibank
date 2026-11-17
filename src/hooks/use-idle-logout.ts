'use client';

import { getSession, signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const ACTIVITY_SYNC_INTERVAL_MS = 15 * 1000;
const SESSION_REFRESH_INTERVAL_MS = 60 * 1000;
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
    let isSigningOut = false;
    let lastActivityWrite = 0;
    let lastSessionRefresh = 0;

    const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    let lastActivity = storedLastActivity === null ? Date.now() : Number(storedLastActivity);
    if (!Number.isFinite(lastActivity) || lastActivity > Date.now()) {
      lastActivity = Date.now();
    }

    if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      void signOut({ callbackUrl: LOGIN_PATH });
      return;
    }

    const logout = () => {
      if (isSigningOut) return;
      isSigningOut = true;
      void signOut({ callbackUrl: LOGIN_PATH });
    };

    const scheduleIdleCheck = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        const sharedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
        if (Number.isFinite(sharedActivity) && sharedActivity > lastActivity) {
          lastActivity = sharedActivity;
          scheduleIdleCheck();
          return;
        }
        if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
          logout();
          return;
        }
        scheduleIdleCheck();
      }, Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - lastActivity)));
    };

    const resetIdleTimer = () => {
      if (document.hidden || isSigningOut) return;
      const now = Date.now();
      lastActivity = now;
      if (now - lastActivityWrite >= ACTIVITY_SYNC_INTERVAL_MS) {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        lastActivityWrite = now;
      }
      scheduleIdleCheck();

      if (now - lastSessionRefresh >= SESSION_REFRESH_INTERVAL_MS) {
        lastSessionRefresh = now;
        void getSession()
          .then((session) => {
            if (!session) logout();
          })
          .catch((error: unknown) => {
            console.error('Unable to refresh the active session:', error);
          });
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue) return;
      const sharedActivity = Number(event.newValue);
      if (Number.isFinite(sharedActivity) && sharedActivity > lastActivity) {
        lastActivity = sharedActivity;
        scheduleIdleCheck();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const sharedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
        if (Number.isFinite(sharedActivity) && sharedActivity > lastActivity) {
          lastActivity = sharedActivity;
        }
        if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
          logout();
          return;
        }
        resetIdleTimer();
      }
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'pointermove',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
    ];

    activityEvents.forEach((event) => window.addEventListener(event, resetIdleTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);
    resetIdleTimer();

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((event) => window.removeEventListener(event, resetIdleTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [status]);
}