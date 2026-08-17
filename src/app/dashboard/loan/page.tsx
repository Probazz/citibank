'use client';
import { useState } from 'react';
import { ArrowLeft, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

const loanProducts = [
  { name: 'Personal Loan',   rate: '8.99%',  max: '$50,000',  term: 'Up to 60 months', icon: '👤', color: 'bg-citi-blue-50 border-citi-blue' },
  { name: 'Home Equity Loan',rate: '6.74%',  max: '$500,000', term: 'Up to 30 years',  icon: '🏠', color: 'bg-green-50 border-citi-green' },
  { name: 'Auto Loan',       rate: '7.49%',  max: '$100,000', term: 'Up to 72 months', icon: '🚗', color: 'bg-purple-50 border-purple-400' },
  { name: 'Student Loan',    rate: '4.99%',  max: '$150,000', term: 'Up to 20 years',  icon: '🎓', color: 'bg-yellow-50 border-yellow-400' },
];

export default function LoanPage() {
  const [selected, setSelected]   = useState<any>(null);
  const [amount, setAmount]       = useState('');
  const [term, setTerm]           = useState('12');
  const [submitted, setSubmitted] = useState(false);

  const monthlyPayment = amount && term
    ? ((parseFloat(amount) * (1 + (parseFloat(selected?.rate || '8.99') / 100))) / parseInt(term)).toFixed(2)
    : null;

  function handleApply() {
    if (!amount || !selected) return;
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-citi-gray-200 p-10 text-center">
        <div className="w-20 h-20 bg-citi-green-light rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-citi-green" />
        </div>
        <h2 className="text-2xl font-black text-citi-gray-800 mb-2">Application Submitted!</h2>
        <p className="text-citi-gray-500 mb-6">Your loan application is under review. We'll notify you within 1-3 business days.</p>
        <div className="bg-citi-gray-50 rounded-xl p-5 text-left space-y-3 mb-8">
          {[
            ['Loan Type',       selected?.name],
            ['Amount Requested', formatCurrency(parseFloat(amount))],
            ['Term',            `${term} months`],
            ['Est. Monthly',    monthlyPayment ? `$${monthlyPayment}` : '—'],
            ['Status',          '⏳ Under Review'],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span className="text-sm text-citi-gray-400">{l}</span>
              <span className="text-sm font-semibold text-citi-gray-800">{v}</span>
            </div>
          ))}
        </div>
        <Link href="/dashboard">
          <Button fullWidth>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-citi-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-citi-gray-800">Citi Loans</h1>
          <p className="text-citi-gray-500 text-sm">Competitive rates for every need</p>
        </div>
      </div>

      {/* Loan products */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {loanProducts.map(product => (
          <button
            key={product.name}
            onClick={() => setSelected(product)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selected?.name === product.name
                ? 'border-citi-blue bg-citi-blue-50 shadow-md scale-[1.02]'
                : `${product.color} hover:shadow-md`
            }`}
          >
            <span className="text-2xl mb-2 block">{product.icon}</span>
            <p className="font-bold text-citi-gray-800 text-sm">{product.name}</p>
            <p className="text-citi-green font-black text-lg mt-1">From {product.rate}</p>
            <p className="text-xs text-citi-gray-400 mt-0.5">Up to {product.max}</p>
            <p className="text-xs text-citi-gray-400">{product.term}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-6 space-y-5 animate-fade-in">
          <h2 className="text-lg font-bold text-citi-gray-800">Apply for {selected.name}</h2>

          <div className="p-4 bg-citi-blue-50 rounded-xl border border-blue-100">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-xs text-citi-gray-400">Rate from</p><p className="font-black text-citi-blue">{selected.rate}</p></div>
              <div><p className="text-xs text-citi-gray-400">Max amount</p><p className="font-black text-citi-blue">{selected.max}</p></div>
              <div><p className="text-xs text-citi-gray-400">Term</p><p className="font-black text-citi-blue">{selected.term}</p></div>
            </div>
          </div>

          <div>
            <label className="citi-label">Loan Amount ($)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-citi-gray-500 font-semibold">$</span>
              <input
                type="number"
                placeholder="0.00"
                min="1000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="citi-input pl-8"
              />
            </div>
          </div>

          <div>
            <label className="citi-label">Loan Term</label>
            <select value={term} onChange={e => setTerm(e.target.value)} className="citi-input">
              {[6, 12, 24, 36, 48, 60].map(m => (
                <option key={m} value={m}>{m} months</option>
              ))}
            </select>
          </div>

          {monthlyPayment && (
            <div className="p-4 bg-citi-green-light border border-green-200 rounded-xl">
              <p className="text-xs text-citi-green font-medium">Estimated Monthly Payment</p>
              <p className="text-2xl font-black text-citi-green">${monthlyPayment}</p>
              <p className="text-xs text-citi-gray-400 mt-1">Based on {selected.rate} APR over {term} months</p>
            </div>
          )}

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">Approval subject to credit check. Final rates may vary based on your credit score and history.</p>
          </div>

          <Button onClick={handleApply} fullWidth size="lg" disabled={!amount || parseFloat(amount) <= 0}>
            <DollarSign className="w-4 h-4" /> Submit Loan Application
          </Button>
        </div>
      )}
    </div>
  );
}