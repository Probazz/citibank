'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Badge, Toast, useToast } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('PENDING');
  const [actionLoading, setActionLoading] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [modalOpen, setModalOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/withdrawals');
    const data = await res.json();
    setWithdrawals(data.withdrawals || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction() {
    if (!selected) return;
    setActionLoading(selected.id);
    const res  = await fetch('/api/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, action: actionType, adminNote }),
    });
    const data = await res.json();
    setActionLoading('');
    setModalOpen(false);
    setAdminNote('');
    if (res.ok) { showToast(data.message, 'success'); load(); }
    else showToast(data.error || 'Action failed.', 'error');
  }

  function openModal(w: any, action: 'APPROVE' | 'REJECT') {
    setSelected(w); setActionType(action); setAdminNote(''); setModalOpen(true);
  }

  const filtered = filter === 'ALL' ? withdrawals : withdrawals.filter(w => w.status === filter);

  const pending  = withdrawals.filter(w => w.status === 'PENDING').length;
  const approved = withdrawals.filter(w => w.status === 'APPROVED').length;
  const rejected = withdrawals.filter(w => w.status === 'REJECTED').length;

  const statusConfig: Record<string, { variant: any }> = {
    PENDING:  { variant: 'warning' },
    APPROVED: { variant: 'success' },
    REJECTED: { variant: 'error'   },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 className="text-2xl font-black text-citi-gray-800">Withdrawal Requests</h1>
        <p className="text-citi-gray-500 text-sm mt-1">Review and process user withdrawal requests</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending',  count: pending,  color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-200', icon: <Clock className="w-5 h-5 text-yellow-500" /> },
          { label: 'Approved', count: approved, color: 'text-citi-green', bg: 'bg-citi-green-light', border: 'border-green-200', icon: <CheckCircle className="w-5 h-5 text-citi-green" /> },
          { label: 'Rejected', count: rejected, color: 'text-citi-red',   bg: 'bg-citi-red-light',   border: 'border-red-200', icon: <XCircle className="w-5 h-5 text-citi-red" /> },
        ].map(({ label, count, color, bg, border, icon }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4 flex items-center gap-3`}>
            {icon}
            <div>
              <p className="text-xs font-medium text-citi-gray-500">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === f ? 'bg-citi-blue text-white' : 'bg-white border border-citi-gray-200 text-citi-gray-600 hover:bg-citi-gray-50'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-citi-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 flex justify-center"><div className="animate-spin w-8 h-8 border-2 border-citi-blue border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-citi-gray-600 font-medium">No {filter.toLowerCase()} requests</p>
          </div>
        ) : (
          <div className="divide-y divide-citi-gray-100">
            {filtered.map(w => (
              <div key={w.id} className="p-5 hover:bg-citi-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-xl text-citi-gray-800">{formatCurrency(w.amount)}</p>
                      <Badge variant={statusConfig[w.status]?.variant}>{w.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-citi-gray-400">User</p>
                        <p className="font-medium text-citi-gray-700">{w.user?.firstName} {w.user?.lastName}</p>
                        <p className="text-xs text-citi-gray-400">{w.user?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-citi-gray-400">Bank</p>
                        <p className="font-medium text-citi-gray-700">{w.bankName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-citi-gray-400">Account</p>
                        <p className="font-medium text-citi-gray-700">••••{w.accountNumber.slice(-4)}</p>
                        <p className="text-xs text-citi-gray-500">{w.accountName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-citi-gray-400">Requested</p>
                        <p className="font-medium text-citi-gray-700">{formatDateTime(w.createdAt)}</p>
                      </div>
                    </div>
                    {w.note && <p className="text-xs text-citi-gray-500 mt-2">Note: {w.note}</p>}
                    {w.adminNote && <p className="text-xs text-citi-red mt-1">Admin: {w.adminNote}</p>}
                  </div>
                  {w.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" onClick={() => openModal(w, 'APPROVE')} loading={actionLoading === w.id}>
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => openModal(w, 'REJECT')} loading={actionLoading === w.id}>
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={`${actionType === 'APPROVE' ? 'Approve' : 'Reject'} Withdrawal`}>
        {selected && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${actionType === 'APPROVE' ? 'bg-citi-green-light' : 'bg-citi-red-light'}`}>
              <p className="font-bold text-lg">{formatCurrency(selected.amount)}</p>
              <p className="text-sm text-citi-gray-600">To: {selected.user?.firstName} {selected.user?.lastName} · {selected.bankName}</p>
            </div>
            {actionType === 'REJECT' && (
              <div>
                <label className="citi-label">Reason for rejection *</label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Explain why this withdrawal is being rejected..."
                  className="citi-input min-h-[80px] resize-none"
                />
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                fullWidth
                variant={actionType === 'APPROVE' ? 'primary' : 'danger'}
                onClick={handleAction}
                loading={!!actionLoading}
                disabled={actionType === 'REJECT' && !adminNote.trim()}>
                {actionType === 'APPROVE' ? '✓ Confirm Approval' : '✕ Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}