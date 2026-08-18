import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, createdAt, description, amount, status } = await req.json();
    if (!id) return NextResponse.json({ error: 'Transaction ID required.' }, { status: 400 });

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });

    const updateData: any = {};
    if (createdAt)   updateData.createdAt   = new Date(createdAt);
    if (description) updateData.description = description;
    if (amount)      updateData.amount      = parseFloat(amount);
    if (status)      updateData.status      = status;

    const updated = await prisma.transaction.update({ where: { id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        action: 'TRANSACTION_EDITED',
        details: `Admin edited transaction ${id}. Changes: ${JSON.stringify(updateData)}`,
        adminId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Transaction updated.', transaction: updated });
  } catch (err) {
    console.error('Edit transaction error:', err);
    return NextResponse.json({ error: 'Failed to update transaction.' }, { status: 500 });
  }
}