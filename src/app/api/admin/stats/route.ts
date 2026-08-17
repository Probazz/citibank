import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [
    totalUsers,
    activeAccounts,
    frozenAccounts,
    totalBalanceResult,
    totalCredited,
    totalDebited,
    pendingWithdrawals,
    recentTransactions,
    recentUsers,
    auditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.account.count({ where: { status: 'ACTIVE' } }),
    prisma.account.count({ where: { status: 'FROZEN' } }),
    prisma.account.aggregate({ _sum: { balance: true } }),
    prisma.transaction.aggregate({ where: { type: 'ADMIN_CREDIT' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: 'ADMIN_DEBIT' }, _sum: { amount: true } }),
    prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
    prisma.transaction.findMany({
      include: {
        sender:   { select: { firstName: true, lastName: true, email: true } },
        receiver: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.findMany({
      where: { role: 'USER' },
      include: { account: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: { admin: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeAccounts,
    frozenAccounts,
    totalBalance: totalBalanceResult._sum.balance || 0,
    totalCredited: totalCredited._sum.amount || 0,
    totalDebited: totalDebited._sum.amount || 0,
    pendingWithdrawals,
    recentTransactions,
    recentUsers,
    auditLogs,
  });
}