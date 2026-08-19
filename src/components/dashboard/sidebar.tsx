'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, CreditCard,
  Download, Bell, Settings, LogOut, HelpCircle,
  Send, DollarSign, X, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/transactions',  label: 'History',       icon: ArrowLeftRight },
  { href: '/dashboard/transfer',      label: 'Send Money',    icon: Send },
  { href: '/dashboard/withdraw',      label: 'Withdraw',      icon: Download },
  { href: '/dashboard/loan',          label: 'Loans',         icon: DollarSign },
  { href: '/dashboard/cards',         label: 'Cards',         icon: CreditCard },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings',      label: 'Settings',      icon: Settings },
];

export function Sidebar({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const [dark, setDark]           = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.body.style.background = '#0f172a';
      document.body.style.color      = '#f1f5f9';
    } else {
      document.body.style.background = '';
      document.body.style.color      = '';
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-citi-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="flex items-center mb-0 mt-0">
            <img
              src="/citibank-logo3.png"
              alt="Citibank"
              className="w-30 h-10"
            />
          </div>

        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-citi-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-citi-gray-500" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn('nav-item', active && 'nav-item-active')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {label === 'Notifications' && unread > 0 && (
                <span className="ml-auto bg-citi-red text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-citi-gray-200 space-y-1">
        {/* Dark mode toggle */}
        <button onClick={toggleDark} className="nav-item w-full justify-between">
          <div className="flex items-center gap-3">
            <span className="text-base">{dark ? '☀️' : '🌙'}</span>
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${dark ? 'bg-citi-blue' : 'bg-citi-gray-300'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </button>

        <Link href="/dashboard/support" className="nav-item">
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="nav-item w-full text-citi-red hover:bg-red-50 hover:text-citi-red"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-citi-gray-200 h-screen fixed left-0 top-0 z-30 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-card border border-citi-gray-200"
      >
        <Menu className="w-5 h-5 text-citi-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-modal transition-transform duration-300 flex flex-col',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </aside>
    </>
  );
}