'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, AlertCircle, CheckCircle, ArrowLeft, Lock, Building, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

type Step = 'form' | 'pin' | 'confirm' | 'success';
type TransferMode = 'citi' | 'external';

export default function TransferPage() {
  const router = useRouter();
  const [step, setStep]       = useState<Step>('form');
  const [mode, setMode]       = useState<TransferMode>('citi');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [pin, setPin]         = useState('');
  const [reference, setReference]   = useState('');
  const [txId, setTxId]             = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    recipientAccountNumber: '',
    recipientRoutingNumber: '',
    recipientName: '',
    recipientBank: '',
    amount: '',
    description: '',
    note: '',
  });

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  useEffect(() => {
    if (step === 'pin' && error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error, step]);

  function validateForm() {
    if (!form.recipientAccountNumber) return 'Please enter an account number.';
    if (!/^[0-9]{6,17}$/.test(form.recipientAccountNumber)) return 'Enter a valid account number.';
    if (!/^[0-9]{9}$/.test(form.recipientRoutingNumber)) return 'Enter a valid 9-digit routing number.';
    if (mode === 'external' && !form.recipientName) return 'Please enter the recipient name.';
    if (mode === 'external' && !form.recipientBank) return 'Please enter the bank name.';
    if (!form.amount || parseFloat(form.amount) <= 0) return 'Please enter a valid amount.';
    if (parseFloat(form.amount) > 5000000) return 'Maximum transfer limit is $5,000,000.';
    if (!form.description) return 'Please enter a description.';
    return '';
  }

  function handleContinue() {
    const err = validateForm();
    if (err) { setError(err); return; }
    setError('');
    setStep('pin');
  }

  async function verifyPin() {
    if (pin.length !== 4) { setError('Enter your 4-digit PIN.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/setup-pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Incorrect PIN.');
        if (data.noPIN) router.push('/dashboard/settings');
        return;
      }
      setStep('confirm');
    } catch {
      setError('Unable to verify your PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mode,
          amount: parseFloat(form.amount),
          pin,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Transfer failed.');
        setStep('form');
        return;
      }
      setReference(data.reference);
      setTxId(data.transactionId || '');
      setStep('success');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      setStep('form');
    }
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────────
  if (step === 'success') return (
    <div className="max-w-md mx-auto -mt-[70px] sm:-mt-[102px] lg:-mt-[102px] animate-fade-in">
      <div className="bg-white rounded-2xl border border-citi-gray-200 overflow-hidden">

        {/* Success header */}
        <div className="bg-gradient-to-br from-citi-green to-green-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-1">Transfer Successful!</h2>
          <p className="text-green-100 text-sm">Your money is on its way</p>
        </div>

        {/* Receipt details */}
        <div className="p-6">
          <div className="space-y-0 divide-y divide-citi-gray-100 mb-6">
            {[
              ['Amount Sent',    formatCurrency(parseFloat(form.amount))],
              ['To Account',     form.recipientAccountNumber],
              ...(form.recipientName ? [['Recipient', form.recipientName]] : []),
              ...(form.recipientBank ? [['Bank', form.recipientBank]] : []),
              ['Description',    form.description],
              ['Reference',      reference],
              ['Status',         '✓ Completed'],
              ['Date & Time',    new Date().toLocaleString('en-US')],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between items-center py-3">
                <span className="text-sm text-citi-gray-400">{l}</span>
                <span className={`text-sm font-semibold ${l === 'Amount Sent' ? 'text-citi-red' : l === 'Status' ? 'text-citi-green' : 'text-citi-gray-800'}`}>
                  {v}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-citi-gray-400 text-center mb-5">
            A receipt has been sent to your email address.
          </p>

          <div className="flex flex-col gap-3">
            {txId && (
              <Button
                fullWidth
                variant="secondary"
                onClick={() => router.push(`/dashboard/receipt?id=${txId}`)}
              >
                <Download className="w-4 h-4" /> View & Download Receipt
              </Button>
            )}
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                setStep('form');
                setForm({ recipientAccountNumber:'', recipientRoutingNumber:'', recipientName:'', recipientBank:'', amount:'', description:'', note:'' });
                setPin('');
                setError('');
              }}
            >
              Make Another Transfer
            </Button>
            <Button fullWidth onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto -mt-[40px] sm:-mt-[102px] lg:-mt-[102px] animate-fade-in">
      {step !== 'pin' && (
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-citi-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-citi-gray-800">Transfer</h1>
            <p className="text-citi-gray-500 text-sm">Secure bank transfer</p>
          </div>
        </div>
      )}

      {error && step !== 'pin' && (
        <div ref={errorRef} role="alert" className="flex items-center gap-3 p-4 bg-citi-red-light border border-red-200 rounded-xl mb-5">
          <AlertCircle className="w-5 h-5 text-citi-red flex-shrink-0" />
          <p className="text-sm text-citi-red font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">

        {/* ── STEP: FORM ── */}
        {step === 'form' && (
          <div className="space-y-5 animate-fade-in">

            {/* Mode tabs */}
            <div className="flex gap-1 bg-citi-gray-100 p-1 rounded-xl">
              {(['citi', 'external'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    mode === m ? 'bg-white text-citi-blue shadow-sm' : 'text-citi-gray-500'
                  }`}
                >
                  {m === 'citi' ? '🏦 Citi Account' : '🏢 Other Bank'}
                </button>
              ))}
            </div>

            <div className="p-3 bg-citi-blue-50 rounded-xl">
              <p className="text-xs text-citi-blue font-medium">
                {mode === 'citi'
                  ? '✓ Instant transfer to any Citi account'
                  : '✓ Transfer to any US bank account (1-3 business days)'}
              </p>
            </div>

            <Input
              label="Account Number *"
              placeholder={mode === 'citi' ? '10-digit Citi account number' : 'Recipient account number'}
              value={form.recipientAccountNumber}
              onChange={e => update('recipientAccountNumber', e.target.value.replace(/\D/g, ''))}
            />

            {mode === 'external' && (
              <>
                <Input
                  label="Recipient Full Name *"
                  placeholder="Full name as it appears on bank account"
                  value={form.recipientName}
                  onChange={e => update('recipientName', e.target.value)}
                  leftIcon={<Building className="w-4 h-4" />}
                />
                <Input
                  label="Bank Name *"
                  placeholder="e.g. Chase, Wells Fargo, Bank of America"
                  value={form.recipientBank}
                  onChange={e => update('recipientBank', e.target.value)}
                  leftIcon={<Building className="w-4 h-4" />}
                />
              </>
            )}

            <Input
              label="Routing Number *"
              placeholder="9-digit routing number"
              inputMode="numeric"
              maxLength={9}
              value={form.recipientRoutingNumber}
              onChange={e => update('recipientRoutingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
              hint={mode === 'citi' ? 'Use the routing number for the Citi account.' : 'Use the routing number provided by the other bank.'}
            />

            <div>
              <label className="citi-label">Amount (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-citi-gray-500 font-semibold text-lg">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  min="1"
                  max="5000000"
                  step="0.01"
                  value={form.amount}
                  onChange={e => update('amount', e.target.value)}
                  className="citi-input pl-8 text-lg font-semibold"
                />
              </div>
              <p className="text-xs text-citi-gray-400 mt-1">Daily limit: $5,000,000</p>
            </div>

            <Input
              label="Description / Purpose *"
              placeholder="e.g. Rent payment, Invoice #123, Family support"
              value={form.description}
              onChange={e => update('description', e.target.value)}
            />
            <Input
              label="Note (Optional)"
              placeholder="Personal note to recipient..."
              value={form.note}
              onChange={e => update('note', e.target.value)}
            />

            <Button onClick={handleContinue} fullWidth size="lg">
              <Send className="w-4 h-4" /> Continue to PIN
            </Button>
          </div>
        )}

        {/* ── STEP: PIN ── */}
        {step === 'pin' && (
          <div className="animate-fade-in text-center">
            <div className="w-16 h-16 bg-citi-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-citi-blue" />
            </div>
            <h2 className="text-xl font-bold text-citi-gray-800 mb-2">Enter Transaction PIN</h2>
            <p className="text-citi-gray-500 text-sm mb-6">
              Authorizing transfer of{' '}
              <strong className="text-citi-blue">{formatCurrency(parseFloat(form.amount || '0'))}</strong>
            </p>

            {error && (
              <div role="alert" className="flex items-center gap-3 p-4 bg-citi-red-light border border-red-200 rounded-xl mb-6 text-left">
                <AlertCircle className="w-5 h-5 text-citi-red flex-shrink-0" />
                <p className="text-sm text-citi-red font-medium">{error}</p>
              </div>
            )}

            {/* PIN dots display */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center text-2xl font-black transition-all ${
                    pin.length > i
                      ? 'border-citi-blue bg-citi-blue text-white'
                      : 'border-citi-gray-200 bg-citi-gray-50'
                  }`}
                >
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (k === '⌫') setPin(p => p.slice(0, -1));
                    else if (k !== '' && pin.length < 4) setPin(p => p + k);
                  }}
                  className={`h-14 rounded-xl text-xl font-bold transition-all ${
                    k === ''
                      ? ''
                      : 'bg-citi-gray-100 hover:bg-citi-gray-200 active:scale-95 text-citi-gray-800 active:bg-citi-blue active:text-white'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => { setStep('form'); setPin(''); setError(''); }}
              >
                Back
              </Button>
              <Button
                fullWidth
                loading={loading}
                onClick={verifyPin}
                disabled={pin.length !== 4}
              >
                Verify PIN
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: CONFIRM ── */}
        {step === 'confirm' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold text-citi-gray-800 mb-5">Confirm Transfer</h2>

            <div className="bg-citi-gray-50 rounded-xl overflow-hidden mb-6">
              {[
                ['To Account',  `${form.recipientAccountNumber.slice(-10)}`],
                ...(form.recipientName ? [['Recipient',  form.recipientName]] : []),
                ...(form.recipientBank ? [['Bank',       form.recipientBank]] : []),
                ['Amount',      formatCurrency(parseFloat(form.amount))],
                ['Description', form.description],
                ...(form.note  ? [['Note',        form.note]] : []),
                ['Transfer Type', mode === 'citi' ? 'Citi Internal Transfer' : 'External Bank Transfer'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between items-center px-5 py-3.5 border-b border-citi-gray-200 last:border-0">
                  <span className="text-sm text-citi-gray-500">{l}</span>
                  <span className={`text-sm font-semibold ${l === 'Amount' ? 'text-citi-blue text-base font-black' : 'text-citi-gray-800'}`}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-citi-gray-400 text-center mb-5">
              By confirming, you authorize this transfer. A receipt will be sent to your email.
            </p>

            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setStep('form')}>Back</Button>
              <Button onClick={handleConfirm} loading={loading} fullWidth>
                Confirm & Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}