'use client';
import { useSession } from 'next-auth/react';
import { Bell, Headset, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TopbarProps { unread?: number; }

export function Topbar({ unread = 0 }: TopbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const firstName = session?.user?.firstName || 'there';

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <header className={`${pathname === '/dashboard' ? 'flex' : 'hidden'} lg:flex fixed top-0 left-0 lg:left-64 right-0 z-30 min-h-[72px] bg-white border-b border-citi-gray-200 px-3 sm:px-6 py-3 sm:py-4 items-center justify-between gap-2 pl-14 sm:pl-16 lg:pl-6`}>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xs sm:text-lg ml-2 font-bold text-citi-gray-800">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="truncate text-[10px] sm:text-xs ml-2 text-citi-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-3">
        <Link
          href="/dashboard/support"
          title="Contact support"
          className="relative p-1.5 sm:p-2 rounded-xl hover:bg-citi-gray-100 transition-colors"
        >
          <Headset className="w-5 h-5 text-citi-gray-600" />
          
        </Link>
        <Link
          href="/dashboard/notifications"
          className="relative p-1.5 sm:p-2 rounded-xl hover:bg-citi-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-citi-gray-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-citi-red rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
        

        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-3 border-l border-citi-gray-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-citi-blue rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-citi-gray-800 leading-none">
              {session?.user?.firstName} {session?.user?.lastName}
            </p>
            <p className="text-xs text-citi-gray-500 mt-0.5">Personal Banking</p>
          </div>
          <ChevronDown className="w-4 h-4 text-citi-gray-400 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}