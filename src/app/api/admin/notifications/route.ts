import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = 20;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count(),
  ]);

  return NextResponse.json({ notifications, total, page, pages: Math.ceil(total / limit) });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Notification ID required.' }, { status: 400 });

  const notification = await prisma.notification.findUnique({ where: { id }, select: { id: true } });
  if (!notification) return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });

  await prisma.notification.delete({ where: { id } });
  return NextResponse.json({ message: 'Notification deleted successfully.' });
}
