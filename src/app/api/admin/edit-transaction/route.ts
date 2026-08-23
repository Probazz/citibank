import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { TransactionStatus } from '@prisma/client';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, createdAt, description, amount, status } = await req.json();
    if (!id) return NextResponse.json({ error: 'Transaction ID required.' }, { status: 400 });

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });

    const updateData: { createdAt?: Date; description?: string; amount?: number; status?: TransactionStatus } = {};
    if (createdAt !== undefined) {
      const transactionDate = new Date(createdAt);
      if (Number.isNaN(transactionDate.getTime())) {
        return NextResponse.json({ error: 'Enter a valid transaction date.' }, { status: 400 });
      }
      if (transactionDate > new Date()) {
        return NextResponse.json({ error: 'Transaction date cannot be in the future.' }, { status: 400 });
      }
      updateData.createdAt = transactionDate;
    }
    if (description !== undefined) {
      const nextDescription = String(description).trim();
      if (!nextDescription) return NextResponse.json({ error: 'Description cannot be empty.' }, { status: 400 });
      updateData.description = nextDescription;
    }
    if (amount !== undefined) {
      const nextAmount = Number(amount);
      if (!Number.isFinite(nextAmount) || nextAmount < 0) {
        return NextResponse.json({ error: 'Enter a valid transaction amount.' }, { status: 400 });
      }
      updateData.amount = nextAmount;
    }
    if (status !== undefined) {
      if (!Object.values(TransactionStatus).includes(status as TransactionStatus)) {
        return NextResponse.json({ error: 'Enter a valid transaction status.' }, { status: 400 });
      }
      updateData.status = status as TransactionStatus;
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No transaction changes provided.' }, { status: 400 });
    }

    const updated = await prisma.transaction.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        action: 'TRANSACTION_EDITED',
        details: `Admin edited transaction ${id}. Previous: ${JSON.stringify({ createdAt: transaction.createdAt, description: transaction.description, amount: transaction.amount, status: transaction.status })}. Changes: ${JSON.stringify(updateData)}`,
        adminId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Transaction updated.', transaction: updated });
  } catch (err) {
    console.error('Edit transaction error:', err);
    return NextResponse.json({ error: 'Failed to update transaction.' }, { status: 500 });
  }
}