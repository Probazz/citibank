import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref');
  if (!ref) return NextResponse.json({ error: 'Reference required.' }, { status: 400 });

  const transaction = await prisma.transaction.findFirst({
    where: {
      reference: ref,
      OR: [
        { senderId:   session.user.id },
        { receiverId: session.user.id },
      ],
    },
  });

  return NextResponse.json({ transaction });
}