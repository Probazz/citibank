import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateReference } from '@/lib/utils';
import { z } from 'zod';

const withdrawalSchema = z.object({
  amount: z.number().positive().min(1),
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().min(8),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isAdmin = session.user.role === 'ADMIN';
  const where   = isAdmin ? {} : { userId: session.user.id };
  const include = isAdmin ? { user: { select: { firstName: true, lastName: true, email: true } } } : {};

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where,
    ...(isAdmin ? { include } : {}),
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ withdrawals });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = withdrawalSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { account: true },
    });
    if (!user?.account) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    if (user.account.status !== 'ACTIVE') return NextResponse.json({ error: 'Account is not active.' }, { status: 403 });
    if (user.account.balance < data.amount) return NextResponse.json({ error: 'Insufficient funds.' }, { status: 400 });

    // Hold the funds
    const reference = generateReference();
    await prisma.$transaction([
      prisma.account.update({
        where: { id: user.account.id },
        data: { balance: user.account.balance - data.amount },
      }),
      prisma.withdrawalRequest.create({
        data: {
          amount: data.amount,
          bankName: data.bankName,
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          note: data.note,
          userId: session.user.id,
        },
      }),
      prisma.transaction.create({
        data: {
          reference,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount: data.amount,
          balanceBefore: user.account.balance,
          balanceAfter: user.account.balance - data.amount,
          description: `Withdrawal to ${data.bankName} - ${data.accountName}`,
          senderId: session.user.id,
        },
      }),
      prisma.notification.create({
        data: {
          title: 'Withdrawal Request Submitted',
          message: `Your withdrawal of $${data.amount.toFixed(2)} is pending admin approval.`,
          type: 'info',
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({ message: 'Withdrawal request submitted successfully.' });
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    return NextResponse.json({ error: 'Request failed.' }, { status: 500 });
  }
}

// Admin: approve or reject
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, action, adminNote } = await req.json();
  const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id }, include: { user: { include: { account: true } } } });
  if (!withdrawal) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  if (withdrawal.status !== 'PENDING') return NextResponse.json({ error: 'Already processed.' }, { status: 400 });

  const isApproved = action === 'APPROVE';

  const updates: any[] = [
    prisma.withdrawalRequest.update({
      where: { id },
      data: { status: isApproved ? 'APPROVED' : 'REJECTED', adminNote },
    }),
    prisma.notification.create({
      data: {
        title: isApproved ? '✅ Withdrawal Approved' : '❌ Withdrawal Rejected',
        message: isApproved
          ? `Your withdrawal of $${withdrawal.amount.toFixed(2)} has been approved and processed.`
          : `Your withdrawal of $${withdrawal.amount.toFixed(2)} was rejected. ${adminNote || 'Contact support.'}`,
        type: isApproved ? 'success' : 'error',
        userId: withdrawal.userId,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: `WITHDRAWAL_${action}`,
        details: `${action} withdrawal of $${withdrawal.amount} for ${withdrawal.user.email}`,
        adminId: session.user.id,
        targetUserId: withdrawal.userId,
      },
    }),
  ];

  // Refund if rejected
  if (!isApproved && withdrawal.user.account) {
    updates.push(
      prisma.account.update({
        where: { id: withdrawal.user.account.id },
        data: { balance: { increment: withdrawal.amount } },
      })
    );
  }

  await prisma.$transaction(updates);
  return NextResponse.json({ message: `Withdrawal ${isApproved ? 'approved' : 'rejected'} successfully.` });
}