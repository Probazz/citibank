'use client';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

// ── Badge ──────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: 'success' | 'error' | 'warning' | 'info' | 'default'; className?: string; }

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    success: 'bg-citi-green-light text-citi-green',
    error:   'bg-citi-red-light text-citi-red',
    warning: 'bg-yellow-50 text-yellow-700',
    info:    'bg-citi-blue-50 text-citi-blue',
    default: 'bg-citi-gray-100 text-citi-gray-600',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
}

// ── Loading ────────────────────────────────────────────────────
export function Loading({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn('animate-spin text-citi-blue', sizes[size])} />
      {text && <p className="text-sm text-citi-gray-500">{text}</p>}
    </div>
  );
}

// ── Page Loading ───────────────────────────────────────────────
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-citi-gray-50">
      <div className="text-center">
        <div className="flex items-center ml-7">
            <img
              src="/citibank-logo3.png"
              alt="Citibank"
              className="w-30 h-10"
            />
          </div>
        <Loader2 className="w-6 h-6 animate-spin text-citi-blue mx-auto" />
        <p className="mt-3 text-sm text-citi-gray-500">Loading your account...</p>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────
interface ToastProps { message: string; type?: 'success' | 'error' | 'info' | 'warning'; onClose: () => void; }

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: CheckCircle, bg: 'bg-citi-green', text: 'text-white' },
    error:   { icon: XCircle,    bg: 'bg-citi-red',   text: 'text-white' },
    warning: { icon: AlertCircle,bg: 'bg-yellow-500', text: 'text-white' },
    info:    { icon: Info,        bg: 'bg-citi-blue',  text: 'text-white' },
  };
  const { icon: Icon, bg, text } = config[type];

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-modal animate-fade-in', bg, text)}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
}

// ── useToast hook ──────────────────────────────────────────────
import { X } from 'lucide-react';

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => setToast({ message, type });
  const hideToast = () => setToast(null);
  return { toast, showToast, hideToast };
}

// ── Stat Card ──────────────────────────────────────────────────
interface StatCardProps { title: string; value: string; subtitle?: string; icon: React.ReactNode; color?: string; }
export function StatCard({ title, value, subtitle, icon, color = 'bg-citi-blue-50' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-citi-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-citi-gray-800 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-citi-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>{icon}</div>
      </div>
    </div>
  );
}