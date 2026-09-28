'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Share2, ArrowLeft, Copy, Check, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const receiptRef   = useRef<HTMLDivElement>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [copied, setCopied]           = useState(false);
  const [error, setError]             = useState('');
  const id = searchParams.get('id');

  function getCreditedBy(transaction: any) {
    if (transaction?.type !== 'ADMIN_CREDIT' || !transaction.metadata) return '';
    try { return JSON.parse(transaction.metadata).creditedBy || ''; } catch { return ''; }
  }

  function getWireMetadata(transaction: any) {
    if (!transaction?.metadata) return null;
    try {
      const metadata = JSON.parse(transaction.metadata);
      return metadata.transferType === 'INTERNATIONAL_WIRE' ? metadata : null;
    } catch {
      return null;
    }
  }

  function getDisplayTransactionType(type: string) {
    if (type === 'ADMIN_CREDIT') return 'Credit';
    if (type === 'ADMIN_DEBIT') return 'Debit';
    return type?.replace(/_/g, ' ');
  }

  useEffect(() => {
    if (!id) { setError('No transaction ID provided.'); setLoading(false); return; }
    fetch(`/api/receipts?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setTransaction(d.transaction);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load receipt.'); setLoading(false); });
  }, [id]);

  function downloadReceipt() {
    // Open print dialog — user saves as PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow || !transaction) return;

    const isCredit = ['CREDIT','TRANSFER_IN','ADMIN_CREDIT','DEPOSIT'].includes(transaction.type);
    const isTransferIn = transaction.type === 'TRANSFER_IN';
    const isTransferOut = transaction.type === 'TRANSFER_OUT';
    const isPending = transaction.status === 'PENDING';
    const wireMetadata = getWireMetadata(transaction);
    const wireFee = typeof wireMetadata?.estimatedFeeUsd === 'number' ? wireMetadata.estimatedFeeUsd : 0;
    const feeBreakdown = wireMetadata?.feeBreakdown;
    const sign     = isPending ? '' : isCredit ? '+' : '-';
    const color    = isPending ? '#B7791F' : isCredit ? '#1A8C4E' : '#D22630';
    const statusLabel = isPending ? 'Pending Review' : transaction.status === 'COMPLETED' ? 'Transaction Successful' : transaction.status;

    const rows = [
      ['Reference Number', transaction.reference],
      ['Transaction Type', getDisplayTransactionType(transaction.type)],
      ['Status',           transaction.status],
      ...(wireMetadata ? [
        ['Transfer Amount', formatCurrency(transaction.amount)],
        ['Base Outbound Fee', formatCurrency(feeBreakdown?.baseOutboundFeeUsd || 0)],
        ...(feeBreakdown?.corridorSurchargeUsd ? [['Corridor Surcharge', formatCurrency(feeBreakdown.corridorSurchargeUsd)]] : []),
        ['Exchange Spread', `${feeBreakdown?.exchangeSpreadPercent || 0}% (${formatCurrency(feeBreakdown?.exchangeSpreadUsd || 0)})`],
        ['Sender Intermediary Fee', formatCurrency(feeBreakdown?.senderIntermediaryFeeUsd || 0)],
        ['Beneficiary Intermediary Deduction', formatCurrency(feeBreakdown?.beneficiaryIntermediaryDeductionUsd || 0)],
        ['Total Fees', transaction.status === 'COMPLETED' ? formatCurrency(wireFee) : transaction.status === 'PENDING' ? `${formatCurrency(wireFee)} estimated; not charged` : 'Not charged'],
        [transaction.status === 'PENDING' ? 'Estimated Total Sender Cost' : 'Total Debited', transaction.status === 'COMPLETED' ? `-${formatCurrency(transaction.amount + wireFee)}` : transaction.status === 'PENDING' ? `${formatCurrency(transaction.amount + wireFee)}; not debited` : 'Not debited'],
        ...(wireMetadata.resolution?.externalReference ? [['Bank Confirmation Reference', wireMetadata.resolution.externalReference]] : []),
      ] : [['Amount', `${sign}${formatCurrency(transaction.amount)}`]]),
      ['Description',      transaction.description],
      ...(getCreditedBy(transaction) ? [['Credited By', getCreditedBy(transaction)]] : []),
      ...(!isTransferIn && transaction.recipientName ? [['Recipient Name', transaction.recipientName]] : []),
      ...(!isTransferIn && transaction.recipientBank ? [['Recipient Bank', transaction.recipientBank]] : []),
      ...(transaction.note          ? [['Note',           transaction.note]]          : []),
      ['Date & Time',      formatDateTime(transaction.createdAt)],
      ...(!isTransferOut && transaction.sender ? [['Sent By', `${transaction.sender.firstName} ${transaction.sender.lastName}`]] : []),
      ...(!isTransferOut && !isTransferIn && transaction.receiver ? [['Received By', `${transaction.receiver.firstName} ${transaction.receiver.lastName}`]] : []),
    ];

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Citi Receipt - ${transaction.reference}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; }
    .wrapper { max-width: 500px; margin: 40px auto; padding: 0 20px; }
    .header { background: linear-gradient(135deg, #003B70, #0066B3); padding: 32px; text-align: center; border-radius: 16px 16px 0 0; }
    .logo { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
    .amount { font-size: 42px; font-weight: 900; color: ${color}; margin: 16px 0 4px; }
    .subtitle { color: rgba(255,255,255,0.7); font-size: 13px; }
    .status-bar { background: #1A8C4E; color: #fff; text-align: center; padding: 10px; font-weight: 700; font-size: 14px; }
    .body { border: 1px solid #E8EAED; border-top: none; padding: 24px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
    .row:last-child { border-bottom: none; }
    .label { font-size: 13px; color: #80868B; }
    .value { font-size: 13px; font-weight: 600; color: #1a1a2e; text-align: right; max-width: 250px; }
    .amount-row .value { color: ${color}; font-size: 16px; font-weight: 900; }
    .footer { text-align: center; padding: 20px; background: #f9f9fb; border: 1px solid #E8EAED; border-top: none; border-radius: 0 0 16px 16px; }
    .footer p { font-size: 11px; color: #9AA0A6; margin-top: 4px; }
    @media print {
      body { margin: 0; }
      .wrapper { margin: 0 auto; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">CITI®</div>
      <div class="amount">${sign}${formatCurrency(transaction.amount)}</div>
      <div class="subtitle">${formatDateTime(transaction.createdAt)}</div>
    </div>
    <div class="status-bar" style="background:${isPending ? '#B7791F' : '#1A8C4E'}">${statusLabel}</div>
    <div class="body">
      ${rows.map(([l, v]) => `
        <div class="row ${l === 'Amount' ? 'amount-row' : ''}">
          <span class="label">${l}</span>
          <span class="value">${v}</span>
        </div>`).join('')}
    </div>
    <div class="footer">
      <strong>Citibank, N.A.</strong>
      <p>Member FDIC • Equal Housing Lender</p>
      <p>Keep this receipt for your records • Ref: ${transaction.reference}</p>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(() => window.close(), 1000);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  }

  async function copyReference() {
    if (!transaction) return;
    await navigator.clipboard.writeText(
      `Citi Transaction Receipt\nReference: ${transaction.reference}\nAmount: ${formatCurrency(transaction.amount)}\nDate: ${formatDateTime(transaction.createdAt)}\nDescription: ${transaction.description}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareReceipt() {
    if (!transaction) return;
    const text = `Citi Transaction Receipt\nReference: ${transaction.reference}\nAmount: ${formatCurrency(transaction.amount)}\nDate: ${formatDateTime(transaction.createdAt)}`;
    if (navigator.share) {
      await navigator.share({ title: 'Citi Transaction Receipt', text });
    } else {
      copyReference();
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-citi-blue border-t-transparent rounded-full" />
    </div>
  );

  if (error || !transaction) return (
    <div className="max-w-md mx-auto text-center py-20">
      <p className="text-4xl mb-3">📄</p>
      <p className="text-citi-gray-600 font-medium">{error || 'Receipt not found.'}</p>
      <Button onClick={() => router.push('/dashboard/transactions')} className="mt-5">
        View Transactions
      </Button>
    </div>
  );

  const isCredit = ['CREDIT','TRANSFER_IN','ADMIN_CREDIT','DEPOSIT'].includes(transaction.type);
  const isTransferIn = transaction.type === 'TRANSFER_IN';
  const isTransferOut = transaction.type === 'TRANSFER_OUT';
  const isPending = transaction.status === 'PENDING';
  const wireMetadata = getWireMetadata(transaction);
  const wireFee = typeof wireMetadata?.estimatedFeeUsd === 'number' ? wireMetadata.estimatedFeeUsd : 0;
  const feeBreakdown = wireMetadata?.feeBreakdown;
  const sign     = isPending ? '' : isCredit ? '+' : '-';
  const amtColor = isPending ? 'text-yellow-700' : isCredit ? 'text-citi-green' : 'text-citi-red';
  const statusLabel = isPending ? 'Pending Review' : transaction.status === 'COMPLETED' ? 'Transaction Successful' : transaction.status;

  const rows = [
    ['Reference Number', transaction.reference],
    ['Transaction Type', getDisplayTransactionType(transaction.type)],
    ['Status',           transaction.status],
    ...(wireMetadata ? [
      ['Transfer Amount', formatCurrency(transaction.amount)],
      ['Transfer Method', wireMetadata.transferMethod === 'URGENT_SWIFT' ? 'Urgent SWIFT' : 'Standard SWIFT'],
      ['Billing Instruction', wireMetadata.billingInstruction || 'SHA'],
      ['Base Outbound Fee', formatCurrency(feeBreakdown?.baseOutboundFeeUsd || 0)],
      ...(feeBreakdown?.corridorSurchargeUsd ? [['Corridor Surcharge', formatCurrency(feeBreakdown.corridorSurchargeUsd)]] : []),
      ['Exchange Spread', `${feeBreakdown?.exchangeSpreadPercent || 0}% (${formatCurrency(feeBreakdown?.exchangeSpreadUsd || 0)})`],
      ['Sender Intermediary Fee', formatCurrency(feeBreakdown?.senderIntermediaryFeeUsd || 0)],
      ['Beneficiary Intermediary Deduction', formatCurrency(feeBreakdown?.beneficiaryIntermediaryDeductionUsd || 0)],
      ['Total Fees', transaction.status === 'COMPLETED' ? formatCurrency(wireFee) : transaction.status === 'PENDING' ? `${formatCurrency(wireFee)} estimated; not charged` : 'Not charged'],
      [transaction.status === 'PENDING' ? 'Estimated Total Sender Cost' : 'Total Debited', transaction.status === 'COMPLETED' ? `-${formatCurrency(transaction.amount + wireFee)}` : transaction.status === 'PENDING' ? `${formatCurrency(transaction.amount + wireFee)}; not debited` : 'Not debited'],
      ...(wireMetadata.resolution?.externalReference ? [['Bank Confirmation Reference', wireMetadata.resolution.externalReference]] : []),
    ] : [['Amount', `${sign}${formatCurrency(transaction.amount)}`]]),
    ['Description',      transaction.description],
    ...(getCreditedBy(transaction) ? [['Credited By', getCreditedBy(transaction)]] : []),
    ...(!isTransferIn && transaction.recipientName ? [['Recipient Name', transaction.recipientName]] : []),
    ...(!isTransferIn && transaction.recipientBank ? [['Recipient Bank', transaction.recipientBank]] : []),
    ...(transaction.recipientRoutingNumber ? [['Routing Number', transaction.recipientRoutingNumber]] : []),
    ...(transaction.note          ? [['Note',           transaction.note]]          : []),
    ['Date & Time',      formatDateTime(transaction.createdAt)],
    ...(!isTransferOut && transaction.sender ? [['Sent By', `${transaction.sender.firstName} ${transaction.sender.lastName}`]] : []),
    ...(!isTransferOut && !isTransferIn && transaction.receiver ? [['Received By', `${transaction.receiver.firstName} ${transaction.receiver.lastName}`]] : []),
  ];

  return (
    <div className="w-full max-w-md mx-auto -mt-14 sm:mt-0 animate-fade-in pb-4 sm:pb-10">

      {/* Top actions */}
      <div className="flex items-center justify-between gap-1 mb-1 sm:gap-2 sm:mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-citi-gray-500 hover:text-citi-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={shareReceipt}
            className="flex items-center gap-1 px-1.5 py-1 sm:gap-1.5 sm:px-3 sm:py-2 border border-citi-gray-300 rounded-lg text-[11px] sm:text-sm font-medium text-citi-gray-600 hover:bg-citi-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* Receipt card */}
      <div ref={receiptRef} className="bg-white rounded-2xl border border-citi-gray-200 overflow-hidden shadow-card">

        {/* Header */}
        <div className="bg-gradient-to-br from-citi-blue to-citi-blue-light p-3 sm:p-8 text-center text-white">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1.5 sm:mb-3">
            <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          <p className="text-blue-200 text-[10px] sm:text-xs font-medium uppercase tracking-wide mb-1 sm:mb-2">
            {isPending ? 'International Wire Request' : `Transaction ${isCredit ? 'Received' : 'Sent'}`}
          </p>
          <p className={`text-2xl sm:text-4xl font-black break-all ${isCredit ? 'text-green-300' : 'text-white'}`}>
            {sign}{formatCurrency(transaction.amount)}
          </p>
          <p className="text-blue-200 text-xs sm:text-sm mt-1 sm:mt-2">{formatDateTime(transaction.createdAt)}</p>
        </div>

        {/* Status bar */}
        <div className={`${isPending ? 'bg-yellow-700' : 'bg-citi-green'} flex items-center justify-center gap-1.5 py-1.5 sm:gap-2 sm:py-2.5`}>
          {isPending ? <span className="text-white" aria-hidden="true">…</span> : <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
          <span className="text-white text-xs sm:text-sm font-bold">{isPending ? 'Pending Review · No Funds Debited' : statusLabel}</span>
        </div>

        {/* Details */}
        <div className="p-6 sm:p-6">
          <div className="divide-y divide-citi-gray-100">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between items-start py-1 sm:py-3.5 gap-2 sm:gap-3">
                <span className="text-[11px] sm:text-sm text-citi-gray-400 font-medium flex-shrink-0">{label}</span>
                <span className={`text-[11px] sm:text-sm font-semibold text-right break-all min-w-0 ${
                  label === 'Amount' || label === 'Total Debited' || label === 'Estimated Total Sender Cost' ? amtColor :
                  label === 'Status' ? isPending ? 'text-yellow-700' : 'text-citi-green' :
                  label === 'Reference Number' ? 'font-mono text-citi-blue text-xs' :
                  'text-citi-gray-800'
                }`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-citi-gray-50 px-2 sm:px-6 py-1.5 sm:py-4 border-t border-citi-gray-200">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-3">
            <div className="flex items-center mb-0 mt-0">
            <img
              src="/citibank-logo3.png"
              alt="Citibank"
              className="w-20 h-7 sm:w-30 sm:h-10"
            />
          </div>
            <span className="text-xs font-bold text-citi-gray-600">Citibank, N.A.</span>
          </div>
          <p className="text-[10px] sm:text-xs text-citi-gray-400 text-center">Member FDIC • Equal Housing Lender</p>
          <p className="text-[10px] sm:text-xs text-citi-gray-400 text-center mt-0.5 sm:mt-1">Keep this receipt for your records</p>
        </div>
      </div>

      {/* Download button */}
      <Button
        fullWidth
        size="lg"
        onClick={downloadReceipt}
        className="mt-4"
      >
        <Download className="w-4 h-4" /> Download Receipt as PDF
      </Button>

      <p className="text-xs text-citi-gray-400 text-center mt-3">
        {isPending ? 'This wire request is pending review; no transfer receipt email has been sent.' : 'A copy has been sent to your registered email address.'}
      </p>
    </div>
  );
}