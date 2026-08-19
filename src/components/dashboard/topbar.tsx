'use client';
import { useSession } from 'next-auth/react';
import { Bell, Headset, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps { unread?: number; }

export function Topbar({ unread = 0 }: TopbarProps) {
  const { data: session } = useSession();
  const firstName = session?.user?.firstName || 'there';

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <header className="bg-white border-b border-citi-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 lg:pl-6 pl-16">
      <div>
        <h1 className="text-lg font-bold text-citi-gray-800">
          {getGreeting()}, {firstName}!
        </h1>
        <p className="text-xs text-citi-gray-500">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/support"
          title="Contact support"
          className="relative p-2 rounded-xl hover:bg-citi-gray-100 transition-colors"
        >
          <Headset className="w-5 h-5 text-citi-gray-600" />
          
        </Link>
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-xl hover:bg-citi-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-citi-gray-600" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-citi-red rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
        

        <div className="flex items-center gap-2 pl-3 border-l border-citi-gray-200">
          <div className="w-9 h-9 bg-citi-blue rounded-full flex items-center justify-center">
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