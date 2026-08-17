'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, ChevronRight } from 'lucide-react';
import { TransactionItem } from '@/components/dashboard/transaction-item';
import { formatCurrency } from '@/lib/utils';

const TYPES = ['ALL', 'CREDIT', 'DEBIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'WITHDRAWAL', 'ADMIN_CREDIT', 'ADMIN_DEBIT'];

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('ALL');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filter !== 'ALL') params.set('type', filter);
    const res  = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, filter]);

  const filtered = transactions.filter(t =>
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCredits = transactions
    .filter(t => ['CREDIT', 'TRANSFER_IN', 'ADMIN_CREDIT', 'DEPOSIT'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  const totalDebits = transactions
    .filter(t => ['DEBIT', 'TRANSFER_OUT', 'WITHDRAWAL', 'ADMIN_DEBIT'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-citi-gray-800">Transaction History</h1>
          <p className="text-citi-gray-500 text-sm mt-1">{total} total transactions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-citi-gray-300 rounded-lg text-sm font-medium text-citi-gray-600 hover:bg-citi-gray-50 transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-citi-gray-200 p-4">
          <p className="text-xs text-citi-gray-500 font-medium">Total Transactions</p>
          <p className="text-xl font-bold text-citi-gray-800 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-citi-gray-200 p-4">
          <p className="text-xs text-citi-gray-500 font-medium">Total Credited</p>
          <p className="text-xl font-bold text-citi-green mt-1">{formatCurrency(totalCredits)}</p>
        </div>
        <div className="bg-white rounded-xl border border-citi-gray-200 p-4">
          <p className="text-xs text-citi-gray-500 font-medium">Total Debited</p>
          <p className="text-xl font-bold text-citi-red mt-1">{formatCurrency(totalDebits)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-citi-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by description or reference..."
              className="citi-input pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(1); }}
            className="citi-input w-full sm:w-48"
          >
            {TYPES.map(t => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction list */}
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-citi-blue border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-citi-gray-600 font-medium">No transactions found</p>
            <p className="text-citi-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div>
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => router.push(`/dashboard/receipt?id=${t.id}`)}
                className="cursor-pointer hover:bg-citi-gray-50 rounded-xl transition-colors group relative"
              >
                <TransactionItem transaction={t} />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <span className="text-xs text-citi-blue font-medium">View Receipt</span>
                  <ChevronRight className="w-4 h-4 text-citi-blue" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-citi-gray-200">
            <p className="text-sm text-citi-gray-500">
              Showing {Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-citi-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-citi-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 border border-citi-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-citi-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}