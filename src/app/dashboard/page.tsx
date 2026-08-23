'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Send, Download, CreditCard, RefreshCw, Eye, EyeOff, TrendingUp, DollarSign, ClipboardList, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BankCard } from '@/components/dashboard/bank-card';
import { TransactionItem } from '@/components/dashboard/transaction-item';
import { PageLoading } from '@/components/ui/index';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string>('');
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json().catch(() => null);

      if (!res.ok || !json) {
        setData(null);
        setError(json?.error || 'Failed to load account data.');
      } else {
        setData(json);
        setError('');
      }
    } catch {
      setData(null);
      setError('Failed to load account data.');
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadData(); }, []);

  if (loading) return <PageLoading />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-citi-red shadow-sm">
        <p className="text-lg font-bold">Unable to load account data</p>
        <p className="mt-2 text-sm text-red-700">{error || 'Failed to load account data.'}</p>
        <button
          onClick={() => { setLoading(true); loadData(); }}
          className="mt-4 rounded-lg bg-citi-blue px-4 py-2 text-sm font-semibold text-white hover:bg-citi-blue-dark"
        >
          Try again
        </button>
      </div>
    </div>
  );

  const { account, recentTransactions, user } = data;
  const isFrozen    = account?.status === 'FROZEN';
  const isSuspended = account?.status === 'SUSPENDED';

  const quickActions = [
    { label: 'Send Money',   icon: Send,          href: '/dashboard/transfer',     color: 'bg-citi-blue text-white',    emoji: '💸' },
    { label: 'Withdraw',     icon: Download,       href: '/dashboard/withdraw',     color: 'bg-citi-blue text-white',    emoji: '🏧' },
    { label: 'Transactions', icon: ArrowUpRight,   href: '/dashboard/transactions', color: 'bg-citi-blue text-white',    emoji: '📋' },
    { label: 'Cards',         icon: CreditCard,     href: '/dashboard/cards',        color: 'bg-citi-blue text-white',    emoji: '💳' },
    { label: 'Loan',          icon: DollarSign,     href: '/dashboard/loan',         color: 'bg-citi-blue text-white',    emoji: '🏦' },
    { label: 'Pay Bills',     icon: ClipboardList,  href: '/dashboard/pay-bills',    color: 'bg-citi-blue text-white',    emoji: '🧾' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Account status warning */}
      {account?.status && account.status !== 'ACTIVE' && (
        <div className="p-4 bg-citi-red-light border border-red-200 rounded-xl">
          <p className="text-citi-red font-semibold text-sm">
            {isFrozen
              ? '🔒Access Denied: Your account is currently under regulatory review. Deposit-only mode is active.'
              : '⚠️ Your account is suspended. Contact support immediately at citibanksupport4@gmail.com.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">

          {/* Balance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Checking */}
            <div className="bg-gradient-to-br from-citi-blue to-citi-blue-light rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Checking Account</p>
                    {/* FULL account number shown */}
                    {/* <p className="text-white font-serif text-sm font-bold mt-0.5 tracking-widest mb-0.1">
                      {account?.accountNumber || '—'}
                    </p>*/}
                  </div>
                  <button
                    onClick={() => setHideBalance(!hideBalance)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {hideBalance ? '$ ••••••' : formatCurrency(account?.balance ?? 0)}
                </p>
                <p className="text-blue-200 text-xs mt-1">Available Balance</p>
                <div className="flex items-center gap-1 mt-3">
                  <TrendingUp className="w-3 h-3 text-green-300" />
                  <span className="text-green-300 text-xs font-medium">{account?.status ?? 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Savings Account</p>
                {/*<p className="text-white/70 font-mono text-xs mb-4 tracking-widest">
                  {account?.accountNumber ? account.accountNumber.slice(0, 8) + 'XX' : '—'}
                </p>*/}
                <p className="text-3xl font-semibold tracking-tight tabular-nums mt-2">
                  {hideBalance ? '$ ••••••' : formatCurrency(account?.savingsBalance ?? 0)}
                </p>
                <p className="text-slate-400 text-xs mt-1">Available Balance</p>
                <div className="flex items-center gap-1 mt-3">
                  <span className="text-yellow-400 text-xs font-medium">APY 4.65%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account details */}
          <div className="bg-white rounded-2xl border border-citi-gray-200 p-5">
            <h3 className="text-sm font-bold text-citi-gray-700 mb-4 uppercase tracking-wide">Account Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Number</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5 font-sans tracking-wider">
                  {account?.accountNumber || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Routing Number</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5 font-sans">{account?.routingNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">SWIFT Code</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5 font-sans">{account?.swiftCode ?? 'CITIUS33'}</p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Type</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5">{account?.accountType ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Status</p>
                <p className={`text-sm font-bold mt-0.5 ${
                  account?.status === 'ACTIVE'    ? 'text-citi-green' :
                  account?.status === 'FROZEN'    ? 'text-yellow-600' : 'text-citi-red'
                }`}>
                  {account?.status ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Holder</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5">{user?.firstName} {user?.lastName}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-citi-gray-200 p-5">
            <h3 className="text-sm font-bold text-citi-gray-700 mb-4 uppercase tracking-wide">Quick Actions</h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {quickActions.map(({ label, icon: Icon, href, color, emoji }) => (
                <Link
                  key={label}
                  href={isSuspended ? '#' : href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors group ${
                    isSuspended ? 'opacity-40 cursor-not-allowed' : 'hover:bg-citi-gray-50'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-citi-gray-600 text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
            {(isFrozen || isSuspended) && (
              <p className="text-xs text-citi-red text-center mt-3">
                Transactions are disabled while your account is {account?.status?.toLowerCase()}.
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Bank Card */}
          {account?.cards?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-citi-gray-700 uppercase tracking-wide">My Card</h3>
                <Link href="/dashboard/cards" className="text-xs text-citi-blue font-medium hover:underline">Manage</Link>
              </div>
              <BankCard {...account.cards[0]} />
            </div>
          )}

          {/* Recent Transactions — CLICKABLE */}
          <div className="bg-white rounded-2xl border border-citi-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-citi-gray-700 uppercase tracking-wide">Recent Activity</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setRefreshing(true); loadData(); }}
                  className="p-1.5 rounded-lg hover:bg-citi-gray-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-citi-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <Link href="/dashboard/transactions" className="text-xs text-citi-blue font-medium hover:underline">
                  View all
                </Link>
              </div>
            </div>

            {!recentTransactions?.length ? (
              <div className="text-center py-8">
                <p className="text-citi-gray-400 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/dashboard/receipt?id=${t.id}`)}
                    className="cursor-pointer hover:bg-citi-gray-50 rounded-xl transition-colors group relative"
                  >
                    <TransactionItem transaction={t} />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-citi-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}