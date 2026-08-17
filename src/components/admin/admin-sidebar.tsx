'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Users, ArrowLeftRight, Download, FileText, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin',                label: 'Overview',     icon: LayoutDashboard },
  { href: '/admin/users',          label: 'Users',        icon: Users },
  { href: '/admin/transactions',   label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/withdrawals',    label: 'Withdrawals',  icon: Download },
];

export function AdminSidebar({ pendingWithdrawals = 0 }: { pendingWithdrawals?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-citi-blue min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-citi-blue font-black text-lg">C</span>
          </div>
          <div>
            <p className="font-black text-white text-lg leading-none">Citi</p>
            <p className="text-xs text-blue-200">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Admin badge */}
      <div className="mx-4 mt-4 px-3 py-2 bg-white/10 rounded-lg flex items-center gap-2">
        <Shield className="w-4 h-4 text-yellow-300" />
        <span className="text-xs font-semibold text-white">System Administrator</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                active ? 'bg-white text-citi-blue' : 'text-blue-100 hover:bg-white/10 hover:text-white'
              )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {label === 'Withdrawals' && pendingWithdrawals > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {pendingWithdrawals}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-all mb-1">
          <LayoutDashboard className="w-4 h-4" />
          <span>User Dashboard</span>
        </Link>
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}