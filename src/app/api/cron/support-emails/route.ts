import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendSupportSecurityRestrictionEmail } from '@/lib/email';

export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const now = new Date();
  const jobs = await prisma.supportEmailJob.findMany({
    where: {
      OR: [
        { status: 'PENDING', sendAt: { lte: now }, nextAttemptAt: null },
        { status: 'PENDING', sendAt: { lte: now }, nextAttemptAt: { lte: now } },
        { status: 'FAILED', nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: { sendAt: 'asc' },
    take: 20,
  });

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    const claimed = await prisma.supportEmailJob.updateMany({
      where: { id: job.id, status: job.status },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;

    try {
      await sendSupportSecurityRestrictionEmail(job.email, job.firstName);
      await prisma.supportEmailJob.update({
        where: { id: job.id },
        data: { status: 'SENT', sentAt: new Date(), lastError: null },
      });
      sent += 1;
    } catch (error) {
      const attempts = job.attempts + 1;
      const retryAt = new Date(Date.now() + Math.min(60 * 60 * 1000, 5 * 60 * 1000 * attempts));
      await prisma.supportEmailJob.update({
        where: { id: job.id },
        data: {
          status: attempts >= 6 ? 'FAILED' : 'PENDING',
          nextAttemptAt: attempts >= 6 ? null : retryAt,
          lastError: error instanceof Error ? error.message : 'Unknown email error',
        },
      });
      failed += 1;
    }
  }

  return NextResponse.json({ processed: jobs.length, sent, failed });
}