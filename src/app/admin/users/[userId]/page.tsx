import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Landmark } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { TransactionItem } from '@/components/dashboard/transaction-item';

export default async function AdminUserDashboard({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      account: { include: { cards: true } },
      sentTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      receivedTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!user) notFound();

  const transactions = [...user.sentTransactions, ...user.receivedTransactions]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="p-2 rounded-lg hover:bg-citi-gray-100" title="Back to users">
          <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-citi-gray-800">{user.firstName} {user.lastName}&apos;s Dashboard</h1>
          <p className="text-citi-gray-500 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-5">
          <div className="flex items-center gap-2 text-citi-gray-500 text-sm"><Landmark className="w-4 h-4" /> Checking Balance</div>
          <p className="text-2xl font-black text-citi-gray-800 mt-2 break-words">{formatCurrency(user.account?.balance || 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-5">
          <div className="flex items-center gap-2 text-citi-gray-500 text-sm"><CreditCard className="w-4 h-4" /> Account Status</div>
          <p className="text-2xl font-black text-citi-gray-800 mt-2">{user.account?.status || 'NO ACCOUNT'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-citi-gray-200 p-5">
          <p className="text-sm text-citi-gray-500">Account Number</p>
          <p className="text-xl font-black text-citi-blue mt-2 break-all">{user.account?.accountNumber || '—'}</p>
          <p className="text-xs text-citi-gray-400 mt-1">Joined {formatDateTime(user.createdAt)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
        <h2 className="font-bold text-citi-gray-800 mb-3">Recent Transactions</h2>
        {transactions.length ? transactions.map(transaction => (
          <div key={transaction.id} className="flex items-center gap-3">
            <div className="flex-1"><TransactionItem transaction={transaction} /></div>
            <Link href={`/admin/receipt?id=${transaction.id}`} className="text-xs text-citi-blue font-medium hover:underline">Receipt</Link>
          </div>
        )) : <p className="py-8 text-center text-sm text-citi-gray-400">No transactions yet</p>}
      </div>
    </div>
  );
}