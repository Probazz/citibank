'use client';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:  'bg-citi-blue text-white hover:bg-citi-blue-dark focus:ring-citi-blue',
      secondary:'bg-citi-blue-50 text-citi-blue hover:bg-blue-100 focus:ring-citi-blue',
      danger:   'bg-citi-red text-white hover:bg-red-700 focus:ring-citi-red',
      ghost:    'bg-transparent text-citi-gray-600 hover:bg-citi-gray-100 focus:ring-citi-gray-300',
      outline:  'bg-white text-citi-blue border border-citi-blue hover:bg-citi-blue-50 focus:ring-citi-blue',
    };

    const sizes = {
      sm: 'text-xs px-3 py-2',
      md: 'text-sm px-5 py-2.5',
      lg: 'text-base px-7 py-3.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };