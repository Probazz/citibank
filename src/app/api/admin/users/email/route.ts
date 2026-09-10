import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAdminUserEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { userId, subject, message } = await req.json();
    if (!userId) return NextResponse.json({ error: 'User ID required.' }, { status: 400 });
    if (typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 150) {
      return NextResponse.json({ error: 'Subject must be between 3 and 150 characters.' }, { status: 400 });
    }
    if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 10000) {
      return NextResponse.json({ error: 'Message must be between 10 and 10,000 characters.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, role: true },
    });
    if (!user || user.role !== 'USER') {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const delivery = await sendAdminUserEmail(user.email, user.firstName, subject.trim(), message.trim());
    await prisma.auditLog.create({
      data: {
        action: 'SEND_SECURITY_EMAIL',
        details: `Manual email sent to ${user.email}: ${subject.trim()}`,
        adminId: session.user.id,
        targetUserId: user.id,
      },
    });

    return NextResponse.json({ message: `Email accepted for delivery to ${user.email}.`, messageId: delivery.messageId });
  } catch (error) {
    console.error('Admin security email failed:', error);
    return NextResponse.json({ error: 'Unable to send security email.' }, { status: 500 });
  }
}