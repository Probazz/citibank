import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const type  = searchParams.get('type');
  const skip  = (page - 1) * limit;

  const where: any = {};
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

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { transactionId } = await req.json();
  if (!transactionId) return NextResponse.json({ error: 'Transaction ID required.' }, { status: 400 });

  // Only remove the selected transaction row. User and account records are never touched here.
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true },
  });
  if (!transaction) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });

  await prisma.transaction.delete({ where: { id: transactionId } });
  return NextResponse.json({ message: 'Transaction deleted successfully.' });
}