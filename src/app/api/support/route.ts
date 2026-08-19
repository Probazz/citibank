import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const supportSchema = z.object({
  category: z.string().min(1).max(80),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  try {
    supportSchema.parse(await req.json());
    return NextResponse.json({ message: 'Your support request has been received. The bank will get back to you shortly.' });
  } catch (error: any) {
    if (error.name === 'ZodError') return NextResponse.json({ error: 'Please complete all fields correctly.' }, { status: 400 });
    return NextResponse.json({ error: 'Unable to submit your support request.' }, { status: 400 });
  }
}