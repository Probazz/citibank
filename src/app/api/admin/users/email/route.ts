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
    const body = await req.json();
    const { userId, userIds, subject, message } = body;
    if (typeof subject !== 'string' || subject.trim().length < 3 || subject.trim().length > 150) {
      return NextResponse.json({ error: 'Subject must be between 3 and 150 characters.' }, { status: 400 });
    }
    if (typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 10000) {
      return NextResponse.json({ error: 'Message must be between 10 and 10,000 characters.' }, { status: 400 });
    }

    if (userIds !== undefined) {
      if (!Array.isArray(userIds) || userIds.length === 0 || userIds.some(id => typeof id !== 'string' || !id.trim())) {
        return NextResponse.json({ error: 'Select at least one valid user.' }, { status: 400 });
      }

      const uniqueUserIds = Array.from(new Set(userIds as string[]));
      if (uniqueUserIds.length > 50) {
        return NextResponse.json({ error: 'You can email up to 50 users at a time.' }, { status: 400 });
      }

      const users = await prisma.user.findMany({
        where: { id: { in: uniqueUserIds }, role: 'USER' },
        select: { id: true, email: true, firstName: true },
      });
      if (users.length !== uniqueUserIds.length) {
        return NextResponse.json({ error: 'One or more selected users could not be found.' }, { status: 400 });
      }

      const sentUsers = [];
      const failedEmails = [];
      for (const user of users) {
        try {
          await sendAdminUserEmail(user.email, user.firstName, subject.trim(), message.trim());
          sentUsers.push(user);
        } catch (error) {
          console.error('Admin bulk email delivery failed:', { email: user.email, error });
          failedEmails.push(user.email);
        }
      }

      let auditWarning: string | undefined;
      if (sentUsers.length > 0) {
        try {
          await prisma.auditLog.createMany({
            data: sentUsers.map(user => ({
              action: 'SEND_SECURITY_EMAIL',
              details: `Manual email sent to ${user.email}: ${subject.trim()}`,
              adminId: session.user.id,
              targetUserId: user.id,
            })),
          });
        } catch (error) {
          console.error('Admin bulk email audit logging failed:', error);
          auditWarning = 'Email delivery completed, but audit logging failed.';
        }
      }

      const messageText = `Email sent to ${sentUsers.length} of ${users.length} selected users.${failedEmails.length ? ` Failed: ${failedEmails.join(', ')}.` : ''}`;
      return NextResponse.json({
        message: messageText,
        sentCount: sentUsers.length,
        failedCount: failedEmails.length,
        failedEmails,
        sentUserIds: sentUsers.map(user => user.id),
        auditWarning,
      });
    }

    if (typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json({ error: 'User ID required.' }, { status: 400 });
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