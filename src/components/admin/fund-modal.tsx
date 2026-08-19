'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: string; firstName: string; lastName: string; email: string; balance: number } | null;
  onSuccess: () => void;
}

export function FundModal({ isOpen, onClose, user, onSuccess }: FundModalProps) {
  const [type, setType]   = useState<'ADMIN_CREDIT' | 'ADMIN_DEBIT'>('ADMIN_CREDIT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote]   = useState('');
  const [creditedBy, setCreditedBy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function reset() { setAmount(''); setDescription(''); setNote(''); setCreditedBy(''); setError(''); setSuccess(''); setType('ADMIN_CREDIT'); }

  async function handleSubmit() {
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount.'); return; }
    if (!description) { setError('Description is required.'); return; }
    setLoading(true); setError('');
    const res  = await fetch('/api/admin/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, amount: parseFloat(amount), type, description, note, creditedBy }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Operation failed.'); return; }
    setSuccess(`${type === 'ADMIN_CREDIT' ? 'Credited' : 'Debited'} ${formatCurrency(parseFloat(amount))} successfully. New balance: ${formatCurrency(data.newBalance)}`);
    onSuccess();
    setTimeout(() => { reset(); onClose(); }, 2500);
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Fund / Debit Account" size="md">
      {user && (
        <div className="space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3 p-4 bg-citi-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-citi-blue rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">{user.firstName[0]}{user.lastName[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-citi-gray-800">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-citi-gray-500">{user.email}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-citi-gray-400">Current Balance</p>
              <p className="font-bold text-citi-gray-800">{formatCurrency(user.balance)}</p>
            </div>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            {(['ADMIN_CREDIT', 'ADMIN_DEBIT'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${type === t
                  ? t === 'ADMIN_CREDIT' ? 'border-citi-green bg-citi-green-light text-citi-green' : 'border-citi-red bg-citi-red-light text-citi-red'
                  : 'border-citi-gray-200 text-citi-gray-400 hover:border-citi-gray-300'}`}>
                {t === 'ADMIN_CREDIT' ? '💰 Credit' : '📤 Debit'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-citi-red-light rounded-lg">
              <AlertCircle className="w-4 h-4 text-citi-red flex-shrink-0" />
              <p className="text-sm text-citi-red">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-citi-green-light rounded-lg">
              <CheckCircle className="w-4 h-4 text-citi-green flex-shrink-0" />
              <p className="text-sm text-citi-green">{success}</p>
            </div>
          )}

          {/* Form */}
          <div>
            <label className="citi-label">Amount (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-citi-gray-400"><DollarSign className="w-4 h-4" /></span>
              <input type="number" placeholder="0.00" min="0.01" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)} className="citi-input pl-10" />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <p className="text-xs mt-1 font-medium" style={{ color: type === 'ADMIN_CREDIT' ? '#1A8C4E' : '#D22630' }}>
                New balance: {formatCurrency(type === 'ADMIN_CREDIT' ? user.balance + parseFloat(amount) : user.balance - parseFloat(amount))}
              </p>
            )}
          </div>
          <Input label="Description *" placeholder="e.g. Account top-up, Bonus credit, Fee reversal" value={description} onChange={e => setDescription(e.target.value)} />
          {type === 'ADMIN_CREDIT' && (
            <Input label="Credited by (Optional)" placeholder="e.g. Acme Corporation" value={creditedBy} onChange={e => setCreditedBy(e.target.value)} />
          )}
          <Input label="Internal Note (Optional)" placeholder="Admin reference note..." value={note} onChange={e => setNote(e.target.value)} />

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" fullWidth onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button
              fullWidth loading={loading}
              variant={type === 'ADMIN_CREDIT' ? 'primary' : 'danger'}
              onClick={handleSubmit}>
              {type === 'ADMIN_CREDIT' ? 'Credit Account' : 'Debit Account'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}