import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';

type WireMetadata = {
  transferType?: string;
  estimatedFeeUsd?: number;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId : '';
    const decision = body.decision;
    const externalReference = typeof body.externalReference === 'string' ? body.externalReference.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!transactionId || !['COMPLETED', 'FAILED'].includes(decision)) {
      return NextResponse.json({ error: 'A transaction and valid decision are required.' }, { status: 400 });
    }
    if (decision === 'COMPLETED' && !externalReference) {
      return NextResponse.json({ error: 'Enter the bank/provider confirmation reference to confirm a sent wire.' }, { status: 400 });
    }
    if (decision === 'FAILED' && !reason) {
      return NextResponse.json({ error: 'Enter a reason for failing this wire request.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wire = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { sender: { include: { account: true } } },
      });
      if (!wire) throw new Error('WIRE_NOT_FOUND');
      if (wire.status !== 'PENDING') throw new Error('WIRE_ALREADY_RESOLVED');

      let metadata: WireMetadata;
      try {
        metadata = JSON.parse(wire.metadata || '{}');
      } catch {
        throw new Error('WIRE_METADATA_INVALID');
      }
      if (metadata.transferType !== 'INTERNATIONAL_WIRE') throw new Error('NOT_AN_INTERNATIONAL_WIRE');
      if (!wire.sender?.account) throw new Error('SENDER_ACCOUNT_NOT_FOUND');

      const resolvedAt = new Date().toISOString();
      const updatedMetadata = {
        ...metadata,
        resolution: {
          decision,
          externalReference: decision === 'COMPLETED' ? externalReference : undefined,
          reason: decision === 'FAILED' ? reason : undefined,
          adminId: session.user.id,
          resolvedAt,
        },
      };

      if (decision === 'FAILED') {
        const updatedCount = await tx.transaction.updateMany({
          where: { id: wire.id, status: 'PENDING' },
          data: { status: 'FAILED', metadata: JSON.stringify(updatedMetadata) },
        });
        if (!updatedCount.count) throw new Error('WIRE_ALREADY_RESOLVED');
        await tx.notification.create({
          data: {
            title: 'International wire request not completed',
            message: `Your international wire request ${wire.reference} could not be completed. Reason: ${reason}`,
            type: 'warning',
            userId: wire.senderId!,
          },
        });
        await tx.auditLog.create({
          data: {
            action: 'INTERNATIONAL_WIRE_FAILED',
            details: JSON.stringify({ transactionId: wire.id, reference: wire.reference, reason }),
            adminId: session.user.id,
            targetUserId: wire.senderId,
          },
        });
        return { status: 'FAILED' as const, balanceAfter: wire.sender.account.balance };
      }

      const fee = typeof metadata.estimatedFeeUsd === 'number' && Number.isFinite(metadata.estimatedFeeUsd)
        ? Math.max(0, metadata.estimatedFeeUsd)
        : 0;
      const debitAmount = wire.amount + fee;
      const account = wire.sender.account;
      if (account.balance < debitAmount) throw new Error('INSUFFICIENT_FUNDS');

      const changed = await tx.transaction.updateMany({
        where: { id: wire.id, status: 'PENDING' },
        data: { status: 'COMPLETED', metadata: JSON.stringify(updatedMetadata) },
      });
      if (!changed.count) throw new Error('WIRE_ALREADY_RESOLVED');

      const debit = await tx.account.updateMany({
        where: { id: account.id, balance: { gte: debitAmount } },
        data: { balance: { decrement: debitAmount } },
      });
      if (!debit.count) throw new Error('INSUFFICIENT_FUNDS');

      const updatedAccount = await tx.account.findUniqueOrThrow({ where: { id: account.id } });
      const balanceBefore = updatedAccount.balance + debitAmount;
      await tx.transaction.update({
        where: { id: wire.id },
        data: { balanceBefore, balanceAfter: updatedAccount.balance },
      });
      await tx.notification.create({
        data: {
          title: 'International wire marked sent',
          message: `Your international wire ${wire.reference} was marked sent. Transfer: $${wire.amount.toFixed(2)}; wire fee: $${fee.toFixed(2)}; total debited: $${debitAmount.toFixed(2)}. Bank/provider reference: ${externalReference}`,
          type: 'success',
          userId: wire.senderId!,
        },
      });
      await tx.auditLog.create({
        data: {
          action: 'INTERNATIONAL_WIRE_COMPLETED',
          details: JSON.stringify({
            transactionId: wire.id,
            reference: wire.reference,
            externalReference,
            amount: wire.amount,
            fee,
            debitAmount,
            balanceBefore,
            balanceAfter: updatedAccount.balance,
          }),
          adminId: session.user.id,
          targetUserId: wire.senderId,
        },
      });

      return { status: 'COMPLETED' as const, balanceAfter: updatedAccount.balance };
    });

    return NextResponse.json({ message: `Wire request marked ${result.status.toLowerCase()}.`, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const errors: Record<string, { error: string; status: number }> = {
      WIRE_NOT_FOUND: { error: 'Wire request not found.', status: 404 },
      WIRE_ALREADY_RESOLVED: { error: 'This wire request has already been resolved.', status: 409 },
      WIRE_METADATA_INVALID: { error: 'Wire request details are invalid.', status: 400 },
      NOT_AN_INTERNATIONAL_WIRE: { error: 'This transaction is not an international wire request.', status: 400 },
      SENDER_ACCOUNT_NOT_FOUND: { error: 'The sender account could not be found.', status: 404 },
      INSUFFICIENT_FUNDS: { error: 'The sender does not have enough available balance to complete this wire and its fee.', status: 400 },
    };
    const knownError = errors[message];
    if (knownError) return NextResponse.json({ error: knownError.error }, { status: knownError.status });
    console.error('International wire resolution error:', error);
    return NextResponse.json({ error: 'Unable to resolve this wire request.' }, { status: 500 });
  }
}