'use client';

import { useEffect, useState } from 'react';
import { Bell, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

const typeColors: Record<string, string> = {
  success: 'bg-green-50 text-green-700',
  error: 'bg-red-50 text-red-700',
  warning: 'bg-yellow-50 text-yellow-700',
  info: 'bg-blue-50 text-blue-700',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadNotifications(currentPage = page) {
    setLoading(true);
    const res = await fetch(`/api/admin/notifications?page=${currentPage}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unable to load notifications.');
      setLoading(false);
      return;
    }
    setNotifications(data.notifications || []);
    setPages(data.pages || 1);
    setLoading(false);
  }

  async function deleteNotification(id: string) {
    if (!window.confirm('Delete this notification? This action cannot be undone.')) return;

    const res = await fetch('/api/admin/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unable to delete notification.');
      return;
    }

    const remaining = notifications.filter(notification => notification.id !== id);
    if (remaining.length === 0 && page > 1) {
      const previousPage = page - 1;
      setPage(previousPage);
      await loadNotifications(previousPage);
      return;
    }
    setNotifications(remaining);
  }

  useEffect(() => {
    void loadNotifications();
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-citi-gray-800">Notifications</h1>
        <p className="text-citi-gray-500 text-sm mt-1">Review and remove user notifications</p>
      </div>

      {error && <p className="p-3 bg-citi-red-light text-citi-red rounded-lg text-sm">{error}</p>}

      <div className="bg-white rounded-2xl border border-citi-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-citi-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 text-citi-gray-300 mx-auto mb-3" />
            <p className="text-citi-gray-600 font-medium">No notifications found</p>
          </div>
        ) : (
          <div>
            {notifications.map(notification => (
              <div key={notification.id} className="flex items-start gap-4 p-5 border-b border-citi-gray-100 last:border-0">
                <div className={cn('px-2 py-1 rounded text-xs font-semibold capitalize flex-shrink-0', typeColors[notification.type] || typeColors.info)}>
                  {notification.type}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-semibold text-sm text-citi-gray-800">{notification.title}</p>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded', notification.isRead ? 'bg-citi-gray-100 text-citi-gray-500' : 'bg-citi-blue-50 text-citi-blue')}>
                      {notification.isRead ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  <p className="text-sm text-citi-gray-500 mt-1 break-words">{notification.message}</p>
                  <p className="text-xs text-citi-gray-400 mt-2">
                    {notification.user.firstName} {notification.user.lastName} ({notification.user.email}) · {formatDateTime(notification.createdAt)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)} aria-label={`Delete notification: ${notification.title}`} title="Delete notification">
                  <Trash2 className="w-4 h-4 text-citi-red" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => setPage(current => current - 1)} disabled={page === 1 || loading}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <span className="text-sm text-citi-gray-500">Page {page} of {pages}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(current => current + 1)} disabled={page === pages || loading}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
