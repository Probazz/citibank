import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAccountNumber, generateCardNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in again.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { account: { include: { cards: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    let account = user.account;
    if (!account) {
      const generatedAccountNumber = generateAccountNumber();
      const generatedSavingsAccountNumber = generateAccountNumber();
      const generatedCardNumber = generateCardNumber();

      account = await prisma.account.create({
        data: {
          userId: user.id,
          accountNumber: generatedAccountNumber,
          savingsAccountNumber: generatedSavingsAccountNumber,
          balance: 0,
          savingsBalance: 0,
          status: 'ACTIVE',
          accountType: 'Checking',
          cards: {
            create: {
              cardNumber: generatedCardNumber,
              cardHolder: `${user.firstName} ${user.lastName}`.toUpperCase(),
              expiryMonth: '12',
              expiryYear: '2029',
              cvv: Math.floor(100 + Math.random() * 900).toString(),
              cardType: 'VISA',
            },
          },
        },
        include: { cards: true },
      });

      await prisma.notification.create({
        data: {
          title: 'Welcome to Citi! 🎉',
          message: `Your checking account ending in ${generatedAccountNumber.slice(-4)} is ready. Your routing number is 021000089.`,
          type: 'success',
          userId: user.id,
        },
      });
    }

    if (!account.savingsAccountNumber) {
      account = await prisma.account.update({
        where: { id: account.id },
        data: { savingsAccountNumber: generateAccountNumber() },
        include: { cards: true },
      });
    }

    const [recentTransactions, unreadCount, withdrawals] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          OR: [
            { senderId: session.user.id, type: { not: 'TRANSFER_IN' } },
            { receiverId: session.user.id, type: { not: 'TRANSFER_OUT' } },
          ],
        },
        include: {
          sender: { select: { firstName: true, lastName: true } },
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
        profileImage: user.profileImage,
        email: user.email,
        phone: user.phone,
      },
      account: {
        id: account.id,
        accountNumber: account.accountNumber,
        savingsAccountNumber: account.savingsAccountNumber,
        routingNumber: account.routingNumber,
        balance: account.balance,
        savingsBalance: account.savingsBalance,
        status: account.status,
        accountType: account.accountType,
        cards: account.cards,
      },
      recentTransactions,
      unreadNotifications: unreadCount,
      withdrawals,
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to load account data.' }, { status: 500 });
  }
}