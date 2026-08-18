import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword, type } = await req.json();
    if (!email || !otp) return NextResponse.json({ error: 'Email and OTP required.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.otpCode || !user.otpExpires)
      return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 });

    if (user.otpCode !== otp)
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });

    if (new Date() > user.otpExpires)
      return NextResponse.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 });

    // Clear OTP
    const updateData: any = { otpCode: null, otpExpires: null, isEmailVerified: true };

    // If password reset, update password too
    if (type === 'reset' && newPassword) {
      if (newPassword.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
      updateData.password = await bcrypt.hash(newPassword, 12);

      try {
        const { sendPasswordChangedEmail } = await import('@/lib/email');
        await sendPasswordChangedEmail(user.email, user.firstName);
      } catch (error) {
        console.error('Password change email failed:', error);
      }
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    return NextResponse.json({ message: 'Verified successfully.', userId: user.id });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}