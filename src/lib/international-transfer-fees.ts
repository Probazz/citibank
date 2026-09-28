export type TransferMethod = 'STANDARD_SWIFT' | 'URGENT_SWIFT';
export type BillingInstruction = 'OUR' | 'BEN' | 'SHA';

export interface InternationalTransferFeeInput {
  principalUsd: number;
  sourceCurrency: string;
  destinationCurrency: string;
  midMarketRate: number;
  method: TransferMethod;
  billingInstruction: BillingInstruction;
}

export interface InternationalTransferFeeBreakdown {
  baseOutboundFeeUsd: number;
  corridorSurchargeUsd: number;
  exchangeSpreadPercent: number;
  exchangeSpreadUsd: number;
  intermediaryNetworkFeeUsd: number;
  senderIntermediaryFeeUsd: number;
  beneficiaryIntermediaryDeductionUsd: number;
  estimatedBeneficiaryAmount: number;
  senderTotalCostUsd: number;
}

const METHOD_FEES_USD: Record<TransferMethod, number> = {
  STANDARD_SWIFT: 25,
  URGENT_SWIFT: 45,
};

const INTERMEDIARY_FEES_USD: Record<string, number> = {
  default: 20,
  PHP: 30,
  NGN: 35,
  INR: 25,
};

const CORRIDOR_PRICING: Record<string, { baseSurchargeUsd: number; spreadSurchargePercent: number }> = {
  'USD_PHP': { baseSurchargeUsd: 20, spreadSurchargePercent: 1.5 },
  'USD_NGN': { baseSurchargeUsd: 25, spreadSurchargePercent: 2 },
  'USD_INR': { baseSurchargeUsd: 10, spreadSurchargePercent: 0.75 },
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateInternationalTransferFees({
  principalUsd,
  sourceCurrency,
  destinationCurrency,
  midMarketRate,
  method,
  billingInstruction,
}: InternationalTransferFeeInput): InternationalTransferFeeBreakdown {
  if (!Number.isFinite(principalUsd) || principalUsd <= 0) throw new Error('Transfer amount must be positive.');
  if (!Number.isFinite(midMarketRate) || midMarketRate <= 0) throw new Error('A valid exchange rate is required.');
  if (!METHOD_FEES_USD[method]) throw new Error('Unsupported international transfer method.');
  if (!['OUR', 'BEN', 'SHA'].includes(billingInstruction)) throw new Error('Unsupported SWIFT billing instruction.');

  const normalizedSource = sourceCurrency.toUpperCase();
  const normalizedDestination = destinationCurrency.toUpperCase();
  const corridor = CORRIDOR_PRICING[`${normalizedSource}_${normalizedDestination}`]
    || { baseSurchargeUsd: 0, spreadSurchargePercent: 0 };
  const tierSpreadPercent = principalUsd < 1000 ? 3 : principalUsd <= 10000 ? 2 : 1;
  const exchangeSpreadPercent = normalizedSource === normalizedDestination
    ? 0
    : tierSpreadPercent + corridor.spreadSurchargePercent;
  const baseOutboundFeeUsd = METHOD_FEES_USD[method];
  const corridorSurchargeUsd = corridor.baseSurchargeUsd;
  const exchangeSpreadUsd = roundMoney(principalUsd * exchangeSpreadPercent / 100);
  const intermediaryNetworkFeeUsd = INTERMEDIARY_FEES_USD[normalizedDestination]
    ?? INTERMEDIARY_FEES_USD.default;
  const senderIntermediaryFeeUsd = billingInstruction === 'OUR'
    ? intermediaryNetworkFeeUsd
    : billingInstruction === 'SHA'
      ? roundMoney(intermediaryNetworkFeeUsd / 2)
      : 0;
  const beneficiaryIntermediaryDeductionUsd = intermediaryNetworkFeeUsd - senderIntermediaryFeeUsd;
  const estimatedBeneficiaryAmount = roundMoney(Math.max(
    0,
    principalUsd * midMarketRate - beneficiaryIntermediaryDeductionUsd * midMarketRate,
  ));
  const senderTotalCostUsd = roundMoney(
    principalUsd
      + baseOutboundFeeUsd
      + corridorSurchargeUsd
      + exchangeSpreadUsd
      + senderIntermediaryFeeUsd,
  );

  return {
    baseOutboundFeeUsd,
    corridorSurchargeUsd,
    exchangeSpreadPercent,
    exchangeSpreadUsd,
    intermediaryNetworkFeeUsd,
    senderIntermediaryFeeUsd,
    beneficiaryIntermediaryDeductionUsd,
    estimatedBeneficiaryAmount,
    senderTotalCostUsd,
  };
}