import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pin, currentPin } = await req.json();
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin))
    return NextResponse.json({ error: 'PIN must be exactly 4 digits.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  // If user already has a PIN, verify current one before changing
  if (user.transactionPin && currentPin) {
    const valid = await bcrypt.compare(currentPin, user.transactionPin);
    if (!valid) return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 400 });
  }

  const hashedPin = await bcrypt.hash(pin, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { transactionPin: hashedPin } });

  return NextResponse.json({ message: 'Transaction PIN set successfully.' });
}

export async function PUT(req: NextRequest) {
  // Verify PIN
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pin } = await req.json();
  if (!pin) return NextResponse.json({ error: 'PIN required.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.transactionPin)
    return NextResponse.json({ error: 'No PIN set. Please set a transaction PIN first.', noPIN: true }, { status: 400 });

  const valid = await bcrypt.compare(pin, user.transactionPin);
  if (!valid) return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 400 });

  return NextResponse.json({ valid: true });
}