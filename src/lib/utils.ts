import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

export function maskAccountNumber(accountNumber: string): string {
  return `••••${accountNumber.slice(-4)}`;
}

export function maskCardNumber(cardNumber: string): string {
  return `•••• •••• •••• ${cardNumber.slice(-4)}`;
}

export function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CTB${timestamp}${random}`;
}

export function generateAccountNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function generateCardNumber(): string {
  return `4${Math.floor(100000000000000 + Math.random() * 900000000000000).toString().slice(0, 15)}`;
}

export function getTransactionColor(type: string): string {
  const credits = ['CREDIT', 'TRANSFER_IN', 'ADMIN_CREDIT', 'DEPOSIT'];
  return credits.includes(type) ? 'text-citi-green' : 'text-citi-red';
}

export function getTransactionSign(type: string): string {
  const credits = ['CREDIT', 'TRANSFER_IN', 'ADMIN_CREDIT', 'DEPOSIT'];
  return credits.includes(type) ? '+' : '-';
}

export function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    CREDIT: '↓',
    DEBIT: '↑',
    TRANSFER_IN: '←',
    TRANSFER_OUT: '→',
    WITHDRAWAL: '↑',
    DEPOSIT: '↓',
    ADMIN_CREDIT: '↓',
    ADMIN_DEBIT: '↑',
  };
  return icons[type] || '•';
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}