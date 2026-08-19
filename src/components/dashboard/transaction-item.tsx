'use client';
import { formatCurrency, formatDateTime, getTransactionColor, getTransactionSign } from '@/lib/utils';
import { Badge } from '@/components/ui/index';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Building } from 'lucide-react';
import type { Transaction } from '@/types';

interface TransactionItemProps { transaction: Transaction; userId?: string; }

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  CREDIT:       { label: 'Credit',        icon: <ArrowDownLeft className="w-4 h-4" />,  color: 'bg-citi-green-light text-citi-green' },
  DEBIT:        { label: 'Debit',         icon: <ArrowUpRight className="w-4 h-4" />,   color: 'bg-citi-red-light text-citi-red' },
  TRANSFER_IN:  { label: 'Transfer In',   icon: <ArrowDownLeft className="w-4 h-4" />,  color: 'bg-citi-green-light text-citi-green' },
  TRANSFER_OUT: { label: 'Transfer Out',  icon: <ArrowUpRight className="w-4 h-4" />,   color: 'bg-citi-red-light text-citi-red' },
  WITHDRAWAL:   { label: 'Withdrawal',    icon: <ArrowUpRight className="w-4 h-4" />,   color: 'bg-yellow-50 text-yellow-600' },
  DEPOSIT:      { label: 'Deposit',       icon: <ArrowDownLeft className="w-4 h-4" />,  color: 'bg-citi-green-light text-citi-green' },
  ADMIN_CREDIT: { label: 'Credit',        icon: <Building className="w-4 h-4" />,       color: 'bg-citi-green-light text-citi-green' },
  ADMIN_DEBIT:  { label: 'Debit',         icon: <Building className="w-4 h-4" />,       color: 'bg-citi-red-light text-citi-red' },
};

export function TransactionItem({ transaction: t, userId }: TransactionItemProps) {
  const config = typeConfig[t.type] || typeConfig.CREDIT;
  const isCredit = ['CREDIT', 'TRANSFER_IN', 'ADMIN_CREDIT', 'DEPOSIT'].includes(t.type);
  const amountColor = isCredit ? 'text-citi-green' : 'text-citi-gray-800';
  let displayDescription = t.description;
  if (t.type === 'ADMIN_CREDIT' && t.metadata) {
    try {
      displayDescription = JSON.parse(t.metadata).creditedBy || t.description;
    } catch {
      displayDescription = t.description;
    }
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-citi-gray-100 last:border-0 hover:bg-citi-gray-50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-citi-gray-800 truncate">{displayDescription}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-citi-gray-400">{formatDateTime(t.createdAt)}</p>
          {t.category && <span className="text-xs text-citi-gray-400">· {t.category}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${amountColor}`}>
          {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
        </p>
        <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'PENDING' ? 'warning' : 'error'}>
          {t.status}
        </Badge>
      </div>
    </div>
  );
}