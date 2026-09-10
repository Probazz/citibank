import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendSupportReplyEmail, sendSupportRequestEmail, sendSupportSecurityRestrictionEmail } from '@/lib/email';

const supportSchema = z.object({
  category: z.string().min(1).max(80),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    const data = supportSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    await sendSupportRequestEmail({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      category: data.category,
      subject: data.subject,
      message: data.message,
    });
    await sendSupportReplyEmail(user.email, user.firstName, data.message);

    const supportEmailJob = await prisma.supportEmailJob.create({
      data: {
        userId: session.user.id,
        email: user.email,
        firstName: user.firstName,
        sendAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      setTimeout(async () => {
        const claimed = await prisma.supportEmailJob.updateMany({
          where: { id: supportEmailJob.id, status: 'PENDING' },
          data: { status: 'PROCESSING', attempts: { increment: 1 } },
        });
        if (claimed.count !== 1) return;

        try {
          await sendSupportSecurityRestrictionEmail(supportEmailJob.email, supportEmailJob.firstName);
          await prisma.supportEmailJob.update({
            where: { id: supportEmailJob.id },
            data: { status: 'SENT', sentAt: new Date(), lastError: null },
          });
        } catch (error) {
          await prisma.supportEmailJob.update({
            where: { id: supportEmailJob.id },
            data: { status: 'FAILED', lastError: error instanceof Error ? error.message : 'Unknown email error' },
          });
          console.error('Local delayed support security email failed:', error);
        }
      }, 5 * 60 * 1000);
    }

    return NextResponse.json({ message: 'Your support request has been received. The bank will get back to you shortly.' });
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: 'Please complete all fields correctly.' }, { status: 400 });
    return NextResponse.json({ error: 'Unable to submit your support request.' }, { status: 400 });
  }
}