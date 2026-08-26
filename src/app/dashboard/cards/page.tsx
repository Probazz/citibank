'use client';
import { useEffect, useState } from 'react';
import { BankCard } from '@/components/dashboard/bank-card';
import { PageLoading, Badge } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { Shield, Snowflake, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CardsPage() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) return <PageLoading />;
  if (!data?.account?.cards?.length) return (
    <div className="text-center py-20">
      <p className="text-4xl mb-3">💳</p>
      <p className="text-citi-gray-600 font-medium">No cards found on your account.</p>
    </div>
  );

  const card = data.account.cards[0];

  return (
    <div className="max-w-2xl mx-auto -mt-[40px] sm:-mt-28 lg:-mt-28 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-citi-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-citi-gray-800">My Cards</h1>
          <p className="text-citi-gray-500 text-sm">Manage your debit cards</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card visual */}
        <BankCard {...card} />

        {/* Card details */}
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-citi-gray-800">Card Details</h3>
            <button onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs font-medium text-citi-blue hover:underline">
              {showDetails ? <><EyeOff className="w-3.5 h-3.5" /> Hide</> : <><Eye className="w-3.5 h-3.5" /> Show</>}
            </button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Card Number',    value: showDetails ? card.cardNumber.replace(/(.{4})/g,'$1 ').trim() : '•••• •••• •••• ' + card.cardNumber.slice(-4), copy: card.cardNumber },
              { label: 'Card Holder',    value: card.cardHolder },
              { label: 'Expiry Date',    value: `${card.expiryMonth}/${card.expiryYear}` },
              { label: 'CVV',            value: showDetails ? card.cvv : '•••', copy: card.cvv },
              { label: 'Card Type',      value: card.cardType },
              { label: 'Card Status',    value: <Badge variant={card.isActive && !card.isFrozen ? 'success' : 'error'}>{card.isFrozen ? 'Frozen' : card.isActive ? 'Active' : 'Inactive'}</Badge> },
            ].map(({ label, value, copy }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-citi-gray-100 last:border-0">
                <span className="text-sm text-citi-gray-500 font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-citi-gray-800 font-mono">{value}</span>
                  {copy && showDetails && (
                    <button onClick={() => copyToClipboard(copy, label)}
                      className="p-1 rounded hover:bg-citi-gray-100 transition-colors">
                      {copied === label ? <CheckCircle className="w-3.5 h-3.5 text-citi-green" /> : <Copy className="w-3.5 h-3.5 text-citi-gray-400" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security tips */}
        <div className="bg-citi-blue-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-citi-blue" />
            <h3 className="font-bold text-citi-blue text-sm">Card Security Tips</h3>
          </div>
          <ul className="space-y-1.5 text-xs text-citi-blue/80">
            <li>✓ Never share your card number, CVV or PIN with anyone</li>
            <li>✓ Citi will never ask for your full card details via email or phone</li>
            <li>✓ Report suspicious activity immediately</li>
            <li>✓ Use virtual card numbers for online purchases</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-citi-gray-200 p-5 text-center hover:shadow-card-hover transition-shadow cursor-pointer">
            <Snowflake className="w-8 h-8 text-citi-blue mx-auto mb-2" />
            <p className="text-sm font-semibold text-citi-gray-800">Freeze Card</p>
            <p className="text-xs text-citi-gray-500 mt-1">Temporarily block your card</p>
          </div>
          <div className="bg-white rounded-2xl border border-citi-gray-200 p-5 text-center hover:shadow-card-hover transition-shadow cursor-pointer">
            <Shield className="w-8 h-8 text-citi-blue mx-auto mb-2" />
            <p className="text-sm font-semibold text-citi-gray-800">Report Lost</p>
            <p className="text-xs text-citi-gray-500 mt-1">Block and request new card</p>
          </div>
        </div>
      </div>
    </div>
  );
}