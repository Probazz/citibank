'use client';
import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-citi-gray-600 mb-1.5 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-citi-gray-400">{leftIcon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full border rounded-lg px-4 py-3 text-sm text-citi-gray-800 placeholder-citi-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-citi-blue focus:border-transparent',
              'transition-all duration-200 bg-white',
              error ? 'border-citi-red' : 'border-citi-gray-300',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-citi-gray-400">{rightIcon}</div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-citi-red font-medium">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-citi-gray-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };