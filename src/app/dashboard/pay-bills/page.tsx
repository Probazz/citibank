'use client';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, CreditCard, Home, Smartphone, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const billers = [
  { name: 'Utilities', description: 'Electric, water, and gas', icon: Zap },
  { name: 'Mobile Phone', description: 'Pay your wireless bill', icon: Smartphone },
  { name: 'Rent or Mortgage', description: 'Manage housing payments', icon: Home },
  { name: 'Credit Card', description: 'Pay a card balance', icon: CreditCard },
];

export default function PayBillsPage() {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-citi-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
        </Link>
        <div>
          <div className="w-11 h-11 rounded-xl bg-citi-blue text-white flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-citi-gray-800">Pay Bills</h1>
          <p className="text-citi-gray-500 text-sm">Choose a bill category to get started</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {billers.map(({ name, description, icon: Icon }) => (
            <button
              key={name}
              type="button"
              className="flex items-center gap-4 rounded-xl border border-citi-gray-200 p-4 text-left hover:border-citi-blue hover:bg-citi-blue-50 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-citi-blue text-white flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-citi-gray-800">{name}</p>
                <p className="text-xs text-citi-gray-500 mt-1">{description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-xl bg-citi-gray-50 text-center">
          <p className="text-sm text-citi-gray-600">Select a bill category to continue.</p>
          <Link href="/dashboard/transfer" className="inline-block mt-3">
            <Button variant="secondary" size="sm">Use Send Money</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
