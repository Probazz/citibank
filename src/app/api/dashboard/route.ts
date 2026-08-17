import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      account: { include: { cards: true } },
    },
  });

  if (!user?.account) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

  const [recentTransactions, unreadCount, withdrawals] = await Promise.all([
    prisma.transaction.findMany({
      where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
      include: {
        sender:   { select: { firstName: true, lastName: true } },
        receiver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    prisma.withdrawalRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    },
    account: {
      id: user.account.id,
      accountNumber: user.account.accountNumber,
      routingNumber: user.account.routingNumber,
      balance: user.account.balance,
      savingsBalance: user.account.savingsBalance,
      status: user.account.status,
      accountType: user.account.accountType,
      cards: user.account.cards,
    },
    recentTransactions,
    unreadNotifications: unreadCount,
    withdrawals,
  });
}