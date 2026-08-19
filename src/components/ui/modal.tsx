'use client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverflowX = document.body.style.overflowX;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverflowX = document.documentElement.style.overflowX;

    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overflowX = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overflowX = previousBodyOverflowX;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overflowX = previousHtmlOverflowX;
    };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-modal w-full animate-fade-in max-h-[88vh] overflow-hidden my-4', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-citi-gray-200 bg-white sticky top-0 z-10">
            <h2 className="text-lg font-bold text-citi-gray-800">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-citi-gray-100 transition-colors">
              <X className="w-5 h-5 text-citi-gray-500" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto overscroll-contain max-h-[calc(88vh-72px)]">{children}</div>
      </div>
    </div>
  );
}