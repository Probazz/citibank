import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Transaction ID required.' }, { status: 400 });

  try {
    let transaction;

    if (session.user.role === 'ADMIN') {
      // Admin can see any transaction
      transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
          sender:   { select: { firstName: true, lastName: true, email: true } },
          receiver: { select: { firstName: true, lastName: true, email: true } },
        },
      });
    } else {
      // Users can only see their own transactions
      transaction = await prisma.transaction.findFirst({
        where: {
          id,
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id },
          ],
        },
        include: {
          sender:   { select: { firstName: true, lastName: true, email: true } },
          receiver: { select: { firstName: true, lastName: true, email: true } },
        },
      });
    }

    if (!transaction) {
      return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (err) {
    console.error('Receipt error:', err);
    return NextResponse.json({ error: 'Failed to load receipt.' }, { status: 500 });
  }
}