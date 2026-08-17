'use client';
import { useEffect, useState } from 'react';
import { Users, DollarSign, TrendingUp, TrendingDown, Clock, Shield } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { TransactionItem } from '@/components/dashboard/transaction-item';
import { Badge, PageLoading } from '@/components/ui/index';
import Link from 'next/link';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return <PageLoading />;

  const cards = [
    { label: 'Total Users',       value: stats.totalUsers,                       icon: Users,         color: 'bg-citi-blue-50',    iconColor: 'text-citi-blue',  sub: `${stats.activeAccounts} active · ${stats.frozenAccounts} frozen` },
    { label: 'Total Balance',     value: formatCurrency(stats.totalBalance),      icon: DollarSign,    color: 'bg-citi-green-light', iconColor: 'text-citi-green', sub: 'Across all accounts' },
    { label: 'Total Credited',    value: formatCurrency(stats.totalCredited),     icon: TrendingUp,    color: 'bg-citi-green-light', iconColor: 'text-citi-green', sub: 'Admin credits issued' },
    { label: 'Total Debited',     value: formatCurrency(stats.totalDebited),      icon: TrendingDown,  color: 'bg-citi-red-light',   iconColor: 'text-citi-red',   sub: 'Admin debits applied' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals,              icon: Clock,         color: 'bg-yellow-50',        iconColor: 'text-yellow-600', sub: 'Awaiting review' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-citi-gray-800">Admin Overview</h1>
        <p className="text-citi-gray-500 text-sm mt-1">System-wide banking statistics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color, iconColor, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-citi-gray-200 p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <p className="text-xs font-semibold text-citi-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-black text-citi-gray-800 mt-1">{value}</p>
            <p className="text-xs text-citi-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-citi-gray-800">Recent Transactions</h3>
            <Link href="/admin/transactions" className="text-xs text-citi-blue font-medium hover:underline">View all</Link>
          </div>
          {stats.recentTransactions.length === 0 ? (
            <p className="text-center text-citi-gray-400 py-8 text-sm">No transactions yet</p>
          ) : (
            <div>{stats.recentTransactions.slice(0, 5).map((t: any) => <TransactionItem key={t.id} transaction={t} />)}</div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-citi-gray-800">Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-citi-blue font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-citi-gray-50 transition-colors">
                <div className="w-9 h-9 bg-citi-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{u.firstName[0]}{u.lastName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-citi-gray-800 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-citi-gray-400 truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-citi-gray-800">{formatCurrency(u.account?.balance || 0)}</p>
                  <Badge variant={u.account?.status === 'ACTIVE' ? 'success' : 'error'}>
                    {u.account?.status || 'NO ACCOUNT'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      {stats.auditLogs?.length > 0 && (
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-citi-blue" />
            <h3 className="font-bold text-citi-gray-800">Recent Audit Log</h3>
          </div>
          <div className="space-y-2">
            {stats.auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-citi-gray-50 rounded-lg">
                <div>
                  <span className="text-xs font-bold text-citi-blue bg-citi-blue-50 px-2 py-0.5 rounded mr-2">{log.action}</span>
                  <span className="text-xs text-citi-gray-600">{log.details}</span>
                </div>
                <span className="text-xs text-citi-gray-400 flex-shrink-0 ml-4">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}