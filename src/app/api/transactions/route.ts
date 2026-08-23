import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

function generateReference() {
  return `CTB${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

const transferSchema = z.object({
  recipientAccountNumber: z.string().min(6),
  recipientRoutingNumber: z.string().regex(/^\d{9}$/),
  mode:                   z.enum(['citi', 'external']),
  recipientName:          z.string().optional(),
  recipientBank:          z.string().optional(),
  amount:                 z.number().positive().min(1).max(5000000),
  description:            z.string().min(1),
  note:                   z.string().optional(),
  pin:                    z.string().length(4),
});

// ── GET — transaction history ─────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get('page')  || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type  = searchParams.get('type');
  const skip  = (page - 1) * limit;

  const where: any = {
    OR: [
      { senderId: session.user.id, type: { not: 'TRANSFER_IN' } },
      { receiverId: session.user.id, type: { not: 'TRANSFER_OUT' } },
    ],
  };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        sender:   { select: { firstName: true, lastName: true, email: true } },
        receiver: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// ── POST — send money ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = transferSchema.parse(body);

    // ── Get sender ────────────────────────────────────────────
    const sender = await prisma.user.findUnique({
      where:   { id: session.user.id },
      include: { account: true },
    });

    if (!sender?.account) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
    if (sender.account.status === 'FROZEN') {
      return NextResponse.json({ error: 'Your account is frozen. Contact support at citibanksupport4@gmail.com.' }, { status: 403 });
    }
    if (sender.account.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 });
    }
    if (!sender.transactionPin) {
      return NextResponse.json({
        error:  'Please set a transaction PIN in Settings before making transfers.',
        noPIN:  true,
      }, { status: 400 });
    }

    // ── Verify PIN ────────────────────────────────────────────
    const pinValid = await bcrypt.compare(data.pin, sender.transactionPin);
    if (!pinValid) {
      return NextResponse.json({ error: 'You entered an incorrect transaction PIN. Please try again.' }, { status: 400 });
    }

    // ── Check balance ─────────────────────────────────────────
    if (sender.account.balance < data.amount) {
      return NextResponse.json({
        error: `Insufficient funds. Available balance: $${sender.account.balance.toFixed(2)}`,
      }, { status: 400 });
    }

    const senderBalanceBefore = sender.account.balance;
    const senderBalanceAfter  = senderBalanceBefore - data.amount;
    const reference           = generateReference();

    // ── Check if recipient is a Citi account ──────────────────
    const recipientAccount = await prisma.account.findUnique({
      where:   { accountNumber: data.recipientAccountNumber },
      include: { user: true },
    });

    if (data.mode === 'citi' && !recipientAccount) {
      return NextResponse.json({
        error: 'That account number is not a Citibank account. Select Other Bank to make an external transfer.',
      }, { status: 400 });
    }
    if (data.mode === 'citi' && recipientAccount && recipientAccount.routingNumber !== data.recipientRoutingNumber) {
      return NextResponse.json({ error: 'The Citibank account number and routing number do not match.' }, { status: 400 });
    }

    let transactionId = '';

    if (recipientAccount && recipientAccount.userId !== session.user.id) {
      // ── Internal Citi-to-Citi transfer ────────────────────
      if (recipientAccount.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Recipient account is not active.' }, { status: 400 });
      }

      const recipientBalanceBefore = recipientAccount.balance;
      const recipientBalanceAfter  = recipientBalanceBefore + data.amount;

      const [outTx] = await prisma.$transaction([
        // Debit sender
        prisma.transaction.create({
          data: {
            reference,
            type:          'TRANSFER_OUT',
            status:        'COMPLETED',
            amount:        data.amount,
            balanceBefore: senderBalanceBefore,
            balanceAfter:  senderBalanceAfter,
            description:   data.description,
            note:          data.note,
            recipientName: `${recipientAccount.user.firstName} ${recipientAccount.user.lastName}`,
            recipientBank: 'Citibank, N.A.',
            recipientRoutingNumber: recipientAccount.routingNumber,
            senderId:      session.user.id,
            receiverId:    recipientAccount.userId,
          },
        }),
        // Credit recipient
        prisma.transaction.create({
          data: {
            reference:     `${reference}-IN`,
            type:          'TRANSFER_IN',
            status:        'COMPLETED',
            amount:        data.amount,
            balanceBefore: recipientBalanceBefore,
            balanceAfter:  recipientBalanceAfter,
            description:   `Transfer from ${sender.firstName} ${sender.lastName}`,
            note:          data.note,
            recipientName: `${sender.firstName} ${sender.lastName}`,
            recipientBank: 'Citibank, N.A.',
            recipientRoutingNumber: sender.account.routingNumber,
            senderId:      session.user.id,
            receiverId:    recipientAccount.userId,
          },
        }),
        // Update sender balance
        prisma.account.update({
          where: { id: sender.account.id },
          data:  { balance: senderBalanceAfter },
        }),
        // Update recipient balance
        prisma.account.update({
          where: { id: recipientAccount.id },
          data:  { balance: recipientBalanceAfter },
        }),
        // Notify sender
        prisma.notification.create({
          data: {
            title:   'Transfer Sent ✓',
            message: `$${data.amount.toFixed(2)} sent to ${recipientAccount.user.firstName} ${recipientAccount.user.lastName}. Ref: ${reference}`,
            type:    'info',
            userId:  session.user.id,
          },
        }),
        // Notify recipient
        prisma.notification.create({
          data: {
            title:   '💰 Money Received',
            message: `$${data.amount.toFixed(2)} received from ${sender.firstName} ${sender.lastName}. Ref: ${reference}`,
            type:    'success',
            userId:  recipientAccount.userId,
          },
        }),
      ]);

      transactionId = outTx.id;

      // Send email receipts (non-blocking)
      try {
        const { sendTransactionReceipt } = await import('@/lib/email');
        sendTransactionReceipt({
          email:         sender.email,
          firstName:     sender.firstName,
          amount:        data.amount,
          type:          'TRANSFER_OUT',
          description:   data.description,
          reference,
          balanceAfter:  senderBalanceAfter,
          recipientName: `${recipientAccount.user.firstName} ${recipientAccount.user.lastName}`,
          recipientBank: 'Citibank, N.A.',
          date:          new Date(),
        }).catch(console.error);

        sendTransactionReceipt({
          email:         recipientAccount.user.email,
          firstName:     recipientAccount.user.firstName,
          amount:        data.amount,
          type:          'TRANSFER_IN',
          description:   `Transfer from ${sender.firstName} ${sender.lastName}`,
          reference,
          balanceAfter:  recipientBalanceAfter,
          recipientName: `${sender.firstName} ${sender.lastName}`,
          recipientBank: 'Citibank, N.A.',
          date:          new Date(),
        }).catch(console.error);
      } catch {}

    } else {
      // ── External bank transfer ────────────────────────────
      const [outTx] = await prisma.$transaction([
        prisma.transaction.create({
          data: {
            reference,
            type:          'TRANSFER_OUT',
            status:        'COMPLETED',
            amount:        data.amount,
            balanceBefore: senderBalanceBefore,
            balanceAfter:  senderBalanceAfter,
            description:   data.description,
            note:          data.note,
            recipientName: data.recipientName || 'External Account',
            recipientBank: data.recipientBank || 'External Bank',
            recipientRoutingNumber: data.recipientRoutingNumber,
            senderId:      session.user.id,
          },
        }),
        prisma.account.update({
          where: { id: sender.account.id },
          data:  { balance: senderBalanceAfter },
        }),
        prisma.notification.create({
          data: {
            title:   'Transfer Sent ✓',
            message: `$${data.amount.toFixed(2)} sent to ${data.recipientName || 'external account'}. Ref: ${reference}`,
            type:    'info',
            userId:  session.user.id,
          },
        }),
      ]);

      transactionId = outTx.id;

      // Send email receipt (non-blocking)
      try {
        const { sendTransactionReceipt } = await import('@/lib/email');
        sendTransactionReceipt({
          email:         sender.email,
          firstName:     sender.firstName,
          amount:        data.amount,
          type:          'TRANSFER_OUT',
          description:   data.description,
          reference,
          balanceAfter:  senderBalanceAfter,
          recipientName: data.recipientName || 'External Account',
          recipientBank: data.recipientBank || 'External Bank',
          date:          new Date(),
        }).catch(console.error);
      } catch {}
    }

    return NextResponse.json({
      message:       'Transfer successful.',
      reference,
      newBalance:    senderBalanceAfter,
      transactionId,
    });

  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input. Please check all fields.' }, { status: 400 });
    }
    console.error('Transfer error:', err);
    return NextResponse.json({ error: 'Transfer failed. Please try again.' }, { status: 500 });
  }
}