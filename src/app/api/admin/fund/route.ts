import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

function generateReference() {
  return `CTB${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}

const fundSchema = z.object({
  userId: z.string(),
  amount: z.number().positive().min(0.01).max(10000000),
  type: z.enum(['ADMIN_CREDIT', 'ADMIN_DEBIT']),
  description: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = fundSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: data.userId }, include: { account: true } });
    if (!user?.account) return NextResponse.json({ error: 'User account not found.' }, { status: 404 });

    const balanceBefore = user.account.balance;
    const isCredit      = data.type === 'ADMIN_CREDIT';
    const balanceAfter  = isCredit ? balanceBefore + data.amount : balanceBefore - data.amount;

    if (!isCredit && balanceAfter < 0)
      return NextResponse.json({ error: `Insufficient balance. Current balance is $${balanceBefore.toFixed(2)}` }, { status: 400 });

    const reference = generateReference();

    await prisma.$transaction([
      prisma.account.update({ where: { id: user.account.id }, data: { balance: balanceAfter } }),
      prisma.transaction.create({
        data: {
          reference,
          type: data.type,
          status: 'COMPLETED',
          amount: data.amount,
          balanceBefore,
          balanceAfter,
          description: data.description,
          note: data.note,
          senderId: isCredit ? null : data.userId,
          receiverId: isCredit ? data.userId : null,
        },
      }),
      prisma.notification.create({
        data: {
          title: isCredit ? '💰 Account Credited' : '📤 Account Debited',
          message: `Your account has been ${isCredit?'credited':'debited'} ${isCredit?'+':'-'}$${data.amount.toFixed(2)}. ${data.description}. Ref: ${reference}`,
          type: isCredit ? 'success' : 'warning',
          userId: data.userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: isCredit ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
          details: `${isCredit?'Credited':'Debited'} $${data.amount} to/from ${user.email}. Reason: ${data.description}`,
          adminId: session.user.id,
          targetUserId: data.userId,
        },
      }),
    ]);

    return NextResponse.json({ message: `Account ${isCredit?'credited':'debited'} successfully.`, reference, newBalance: balanceAfter });
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid input. Check amount and fields.' }, { status: 400 });
    console.error('Fund error:', err);
    return NextResponse.json({ error: 'Operation failed.' }, { status: 500 });
  }
}