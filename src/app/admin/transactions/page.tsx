'use client';
import { useEffect, useState } from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';
import { TransactionItem } from '@/components/dashboard/transaction-item';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toast, useToast } from '@/components/ui/index';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const TYPES = ['ALL', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'TRANSFER_OUT', 'TRANSFER_IN', 'WITHDRAWAL', 'CREDIT', 'DEBIT'];

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [editTx, setEditTx]     = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (filter !== 'ALL') params.set('type', filter);
    const res  = await fetch(`/api/admin/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, filter]);

  function openEdit(t: any) {
    setEditTx(t);
    setEditDate(new Date(t.createdAt).toISOString().slice(0, 16));
    setEditDesc(t.description);
    setEditAmount(String(t.amount));
  }

  async function saveEdit() {
    if (!editTx) return;
    setEditLoading(true);
    const res  = await fetch('/api/admin/edit-transaction', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editTx.id,
        createdAt: editDate,
        description: editDesc,
        amount: parseFloat(editAmount),
      }),
    });
    const data = await res.json();
    setEditLoading(false);
    if (res.ok) {
      showToast('Transaction updated successfully!', 'success');
      setEditTx(null);
      load();
    } else {
      showToast(data.error || 'Update failed.', 'error');
    }
  }

  async function deleteTransaction(transaction: any) {
    if (!window.confirm(`Delete transaction ${transaction.reference}? This cannot be undone.`)) return;
    setEditLoading(true);
    const res = await fetch('/api/admin/transactions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: transaction.id }),
    });
    const data = await res.json();
    setEditLoading(false);
    if (res.ok) { showToast('Transaction deleted successfully!', 'success'); load(); }
    else showToast(data.error || 'Delete failed.', 'error');
  }

  const filtered = search
    ? transactions.filter(t =>
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.reference?.toLowerCase().includes(search.toLowerCase()) ||
        t.sender?.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.receiver?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  const totalVol = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* The Heading */}
      <div>
        <h1 className="text-2xl font-black text-citi-gray-800">All Transactions</h1>
        <p className="text-citi-gray-500 text-sm mt-1">
          {total} total · Volume: {formatCurrency(totalVol)}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-citi-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reference, description, user email..."
            className="citi-input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="citi-input w-full sm:w-52"
        >
          {TYPES.map(t => (
            <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Histories */}
      <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-citi-blue border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-citi-gray-400 text-sm">No transactions found</div>
        ) : (
          <div>
            {filtered.map(t => (
              <div key={t.id} className="relative group">
                <TransactionItem transaction={t} />

                {/* User info row */}
                <div className="px-2 pb-3 -mt-1 flex items-center gap-4 text-xs text-citi-gray-400">
                  {t.sender && (
                    <span>From: <strong className="text-citi-gray-600">{t.sender.firstName} {t.sender.lastName}</strong></span>
                  )}
                  {t.receiver && (
                    <span>To: <strong className="text-citi-gray-600">{t.receiver.firstName} {t.receiver.lastName}</strong></span>
                  )}
                  <span className="font-mono">{t.reference}</span>
                  <span>{formatDateTime(t.createdAt)}</span>

                  {/* Action buttons */}
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => openEdit(t)}
                      className="flex items-center gap-1 text-xs text-citi-blue font-medium bg-citi-blue-50 px-2.5 py-1 rounded-lg hover:bg-citi-blue hover:text-white transition-all"
                    >
                      <Edit className="w-3 h-3" /> Edit / Backdate
                    </button>
                    <button
                      onClick={() => router.push(`/admin/receipt?id=${t.id}`)}
                      className="text-xs text-citi-gray-500 font-medium bg-citi-gray-100 px-2.5 py-1 rounded-lg hover:bg-citi-gray-200 transition-all"
                    >
                      Receipt
                    </button>
                    <button
                      onClick={() => deleteTransaction(t)}
                      className="flex items-center gap-1 text-xs text-citi-red font-medium bg-citi-red-light px-2.5 py-1 rounded-lg hover:bg-citi-red hover:text-white transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-citi-gray-200">
            <p className="text-sm text-citi-gray-500">Showing {Math.min(page * 25, total)} of {total}</p>
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
                disabled={page * 25 >= total}
                className="px-3 py-1.5 border border-citi-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-citi-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Backdate Modal */}
      <Modal
        isOpen={!!editTx}
        onClose={() => setEditTx(null)}
        title="Edit Transaction / Backdate"
        size="md"
      >
        {editTx && (
          <div className="space-y-4">
            {/* Transaction preview */}
            <div className="p-4 bg-citi-gray-50 rounded-xl border border-citi-gray-200">
              <p className="text-xs text-citi-gray-400 mb-1">Transaction Reference</p>
              <p className="text-sm font-mono font-bold text-citi-blue">{editTx.reference}</p>
              <p className="text-xs text-citi-gray-400 mt-2 mb-1">Current Amount</p>
              <p className="text-sm font-bold text-citi-gray-800">{formatCurrency(editTx.amount)}</p>
              <p className="text-xs text-citi-gray-400 mt-2 mb-1">Current Date</p>
              <p className="text-sm font-bold text-citi-gray-800">{formatDateTime(editTx.createdAt)}</p>
            </div>

            {/* Edit date (backdating) */}
            <div>
              <label className="citi-label">New Transaction Date & Time (Backdating)</label>
              <input
                type="datetime-local"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="citi-input"
              />
              <p className="text-xs text-citi-gray-400 mt-1">
                Change this to backdate the transaction to a different date
              </p>
            </div>

            {/* Edit description */}
            <Input
              label="Description"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              hint="Update the transaction description"
            />

            {/* Edit amount */}
            <div>
              <label className="citi-label">Amount ($)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-citi-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  className="citi-input pl-8"
                />
              </div>
            </div>

            {/* Warning */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-xs text-yellow-700 font-medium">
                ⚠️ All edits are permanently logged in the audit trail with your admin ID and timestamp.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" fullWidth onClick={() => setEditTx(null)}>
                Cancel
              </Button>
              <Button fullWidth loading={editLoading} onClick={saveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}