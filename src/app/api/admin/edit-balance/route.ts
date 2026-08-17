import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, balance, savingsBalance } = await req.json();
    if (!userId) return NextResponse.json({ error: 'User ID required.' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { account: true } });
    if (!user?.account) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    const updateData: any = {};
    if (balance !== undefined)        updateData.balance        = parseFloat(balance);
    if (savingsBalance !== undefined) updateData.savingsBalance = parseFloat(savingsBalance);

    await prisma.account.update({ where: { id: user.account.id }, data: updateData });

    await prisma.auditLog.create({
      data: {
        action: 'BALANCE_EDITED',
        details: `Admin directly edited balance for ${user.email}. New balance: $${balance}, Savings: $${savingsBalance}`,
        adminId: session.user.id,
        targetUserId: userId,
      },
    });

    return NextResponse.json({ message: 'Balance updated successfully.' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update balance.' }, { status: 500 });
  }
}