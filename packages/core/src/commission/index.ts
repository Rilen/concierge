/**
 * CONCIERGE / PALADAR — COMMISSION & REVENUE SPLIT DOMAIN
 *
 * Implements financial split logic according to Constitution Art. 40 (0.5% standard fee)
 * and custom tiered vendor agreements.
 */

export interface CommissionPlan {
  id: string;
  name: string;
  ratePercentage: number; // e.g. 0.5 means 0.5%
  fixedFeeCents: number;
}

export const DEFAULT_PALADAR_COMMISSION_PLAN: CommissionPlan = {
  id: "standard-05",
  name: "Plano Padrão Paladar (0,5%)",
  ratePercentage: 0.5,
  fixedFeeCents: 0,
};

export interface CommissionSplit {
  grossAmountCents: number;
  platformFeeCents: number;
  gatewayFeeCents: number;
  netMerchantCents: number;
  platformFeeRate: number;
}

/**
 * Calculates marketplace commission and merchant net payout with integer precision.
 */
export function calculateCommissionSplit(params: {
  grossTotal: number;
  plan?: CommissionPlan;
  gatewayFee?: number;
}): CommissionSplit {
  const grossAmountCents = Math.round(params.grossTotal * 100);
  const plan = params.plan ?? DEFAULT_PALADAR_COMMISSION_PLAN;
  const gatewayFeeCents = Math.round((params.gatewayFee ?? 0) * 100);

  // platformFee = (gross * rate%) + fixedFee
  const variableFeeCents = Math.round(grossAmountCents * (plan.ratePercentage / 100));
  const platformFeeCents = variableFeeCents + plan.fixedFeeCents;

  const totalDeductionsCents = platformFeeCents + gatewayFeeCents;
  const netMerchantCents = Math.max(0, grossAmountCents - totalDeductionsCents);

  return {
    grossAmountCents,
    platformFeeCents,
    gatewayFeeCents,
    netMerchantCents,
    platformFeeRate: plan.ratePercentage,
  };
}

/**
 * Human readable formatted split in BRL.
 */
export function formatCommissionSplit(split: CommissionSplit) {
  return {
    grossAmount: (split.grossAmountCents / 100).toFixed(2),
    platformFee: (split.platformFeeCents / 100).toFixed(2),
    gatewayFee: (split.gatewayFeeCents / 100).toFixed(2),
    netMerchant: (split.netMerchantCents / 100).toFixed(2),
    ratePercentage: `${split.platformFeeRate}%`,
  };
}
