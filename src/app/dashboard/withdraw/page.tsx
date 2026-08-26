'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/index';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function WithdrawPage() {
  const [tab, setTab]     = useState<'new' | 'history'>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [form, setForm] = useState({ amount: '', bankName: '', accountName: '', accountNumber: '', note: '' });
  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  async function loadHistory() {
    const res  = await fetch('/api/withdrawals');
    const data = await res.json();
    setHistory(data.withdrawals || []);
  }

  useEffect(() => { loadHistory(); }, []);

  async function handleSubmit() {
    if (!form.amount || !form.bankName || !form.accountName || !form.accountNumber) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    const res  = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Request failed.'); return; }
    setSuccess('Withdrawal request submitted! Awaiting admin approval.');
    setForm({ amount: '', bankName: '', accountName: '', accountNumber: '', note: '' });
    loadHistory();
    setTimeout(() => setTab('history'), 2000);
  }

  const statusConfig: Record<string, { variant: any; icon: React.ReactNode }> = {
    PENDING:  { variant: 'warning', icon: <Clock className="w-4 h-4 text-yellow-500" /> },
    APPROVED: { variant: 'success', icon: <CheckCircle className="w-4 h-4 text-citi-green" /> },
    REJECTED: { variant: 'error',   icon: <XCircle className="w-4 h-4 text-citi-red" /> },
  };

  return (
    <div className="max-w-2xl mx-auto -mt-[40px] sm:-mt-28 lg:-mt-28 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-citi-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-citi-gray-800">Withdraw Funds</h1>
          <p className="text-citi-gray-500 text-sm">Request a withdrawal to your bank account</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-citi-gray-100 p-1 rounded-xl mb-6">
        {(['new', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-citi-blue shadow-sm' : 'text-citi-gray-500 hover:text-citi-gray-700'}`}>
            {t === 'new' ? 'New Request' : `History (${history.length})`}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-6 space-y-5 animate-fade-in">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-citi-red-light border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-citi-red flex-shrink-0" />
              <p className="text-sm text-citi-red font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-citi-green-light border border-green-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-citi-green flex-shrink-0" />
              <p className="text-sm text-citi-green font-medium">{success}</p>
            </div>
          )}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs font-semibold text-yellow-700">⚠️ Withdrawals are subject to admin review and may take 1-3 business days to process.</p>
          </div>
          <div>
            <label className="citi-label">Amount (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-citi-gray-500 font-semibold">$</span>
              <input type="number" placeholder="0.00" min="1" step="0.01" value={form.amount}
                onChange={e => update('amount', e.target.value)} className="citi-input pl-8" />
            </div>
          </div>
          <Input label="Bank Name *" placeholder="e.g. Chase, Wells Fargo, Bank of America" value={form.bankName} onChange={e => update('bankName', e.target.value)} />
          <Input label="Account Holder Name *" placeholder="Full name as on bank account" value={form.accountName} onChange={e => update('accountName', e.target.value)} />
          <Input label="Bank Account Number *" placeholder="Your bank account number" value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} />
          <Input label="Note (Optional)" placeholder="Reason for withdrawal..." value={form.note} onChange={e => update('note', e.target.value)} />
          <Button onClick={handleSubmit} loading={loading} fullWidth size="lg">Submit Withdrawal Request</Button>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-6 animate-fade-in">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-citi-gray-600 font-medium">No withdrawal requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(w => (
                <div key={w.id} className="p-4 border border-citi-gray-200 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {statusConfig[w.status]?.icon}
                      <span className="font-bold text-lg text-citi-gray-800">{formatCurrency(w.amount)}</span>
                    </div>
                    <Badge variant={statusConfig[w.status]?.variant || 'default'}>{w.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-citi-gray-400">Bank:</span> <span className="font-medium">{w.bankName}</span></div>
                    <div><span className="text-citi-gray-400">Account:</span> <span className="font-medium">••••{w.accountNumber.slice(-4)}</span></div>
                    <div><span className="text-citi-gray-400">Date:</span> <span className="font-medium">{formatDateTime(w.createdAt)}</span></div>
                    {w.adminNote && <div className="col-span-2"><span className="text-citi-gray-400">Admin Note:</span> <span className="font-medium text-citi-red">{w.adminNote}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}