import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page   = parseInt(searchParams.get('page') || '1');
  const limit  = parseInt(searchParams.get('limit') || '20');
  const skip   = (page - 1) * limit;

  const where: any = {
    role: 'USER',
    OR: search ? [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ] : undefined,
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { account: { include: { cards: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, status, action } = await req.json();
  if (!userId) return NextResponse.json({ error: 'User ID required.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { account: true } });
  if (!user?.account) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  await prisma.$transaction([
    prisma.account.update({ where: { id: user.account.id }, data: { status } }),
    prisma.auditLog.create({
      data: {
        action: `ACCOUNT_${action || status}`,
        details: `Account status changed to ${status} for user ${user.email}`,
        adminId: session.user.id,
        targetUserId: userId,
      },
    }),
    prisma.notification.create({
      data: {
        title: `Account ${status === 'ACTIVE' ? 'Reactivated' : status === 'FROZEN' ? 'Frozen' : 'Suspended'}`,
        message: `Your account has been ${status === 'ACTIVE' ? 'reactivated' : status === 'FROZEN' ? 'temporarily frozen' : 'suspended'}. Contact support for assistance.`,
        type: status === 'ACTIVE' ? 'success' : 'error',
        userId,
      },
    }),
  ]);

  return NextResponse.json({ message: `Account ${status.toLowerCase()} successfully.` });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'User ID required.' }, { status: 400 });
  if (userId === session.user.id) return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || user.role !== 'USER') return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
    prisma.withdrawalRequest.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.auditLog.deleteMany({ where: { OR: [{ adminId: userId }, { targetUserId: userId }] } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ message: 'User deleted successfully.' });
}