'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Info, CheckCircle, AlertCircle, XCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const typeIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle  className="w-5 h-5 text-citi-green" />,
  error:   <XCircle     className="w-5 h-5 text-citi-red" />,
  warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  info:    <Info        className="w-5 h-5 text-citi-blue" />,
};

const typeBg: Record<string, string> = {
  success: 'bg-citi-green-light',
  error:   'bg-citi-red-light',
  warning: 'bg-yellow-50',
  info:    'bg-citi-blue-50',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res  = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function handleClick(n: any) {
    // Mark as read
    if (!n.isRead) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }

    // Try to extract transaction reference from message and navigate to receipt
    const refMatch = n.message?.match(/Ref:\s*([A-Z0-9]+)/);
    if (refMatch) {
      // Find transaction by reference
      const res  = await fetch(`/api/transactions/by-ref?ref=${refMatch[1]}`);
      const data = await res.json();
      if (data.transaction?.id) {
        router.push(`/dashboard/receipt?id=${data.transaction.id}`);
        return;
      }
    }

    // If no transaction ref, just show the notification detail
    alert(`${n.title}\n\n${n.message}`);
  }

  useEffect(() => { load(); }, []);

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto -mt-[40px] sm:-mt-28 lg:-mt-28 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 min-w-0">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-citi-gray-100 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-citi-gray-800 truncate">Notifications</h1>
            <p className="text-citi-gray-500 text-sm mt-1">
              {unread > 0 ? `${unread} unread` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-citi-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-citi-blue border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-citi-gray-300 mx-auto mb-3" />
            <p className="text-citi-gray-600 font-medium">No notifications yet</p>
            <p className="text-citi-gray-400 text-sm mt-1">We'll notify you about account activity here</p>
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  'flex items-start gap-4 p-5 border-b border-citi-gray-100 last:border-0 transition-colors cursor-pointer group',
                  !n.isRead
                    ? 'bg-citi-blue-50/40 hover:bg-citi-blue-50'
                    : 'hover:bg-citi-gray-50'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  typeBg[n.type] || 'bg-citi-gray-100'
                )}>
                  {typeIcons[n.type] || typeIcons.info}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-sm font-semibold',
                      !n.isRead ? 'text-citi-gray-800' : 'text-citi-gray-600'
                    )}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-citi-blue rounded-full mt-1" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-citi-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-citi-gray-400">{formatDateTime(n.createdAt)}</p>
                    {n.message?.includes('Ref:') && (
                      <span className="text-xs text-citi-blue font-medium flex items-center gap-0.5 group-hover:underline">
                        View Receipt <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}