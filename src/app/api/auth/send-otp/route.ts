import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendLoginOTP, sendPasswordResetOTP } from '@/lib/email';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ message: 'If an account exists, a code has been sent.' });

    const otp     = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpires: expires },
    });

    if (type === 'reset') {
      await sendPasswordResetOTP(user.email, user.firstName, otp);
    } else {
      await sendLoginOTP(user.email, user.firstName, otp);
    }

    return NextResponse.json({ message: 'OTP sent successfully.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ error: 'Failed to send OTP.' }, { status: 500 });
  }
}