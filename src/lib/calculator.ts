/**
 * Calculates the Sum Ceded based on Sum Assured, Gross Reserves, and Treaty Retention.
 * 
 * Sum At Risk = Sum Assured - gross reserves
 * Sum Ceded = Sum At Risk - Retention Amount
 */
export const calculateSumCeded = (
  sumAssured: number,
  grossReserves: number,
  retentionType: 'absolute' | 'percentage',
  retentionValue: number
): { sumAtRisk: number, retentionAmount: number, sumCeded: number } => {
  const sumAtRisk = Math.max(0, sumAssured - grossReserves);
  
  let retentionAmount = 0;
  if (retentionType === 'absolute') {
    retentionAmount = retentionValue;
  } else {
    // Percentage usually applied to Sum At Risk or Sum Assured. 
    // Here we apply it to Sum At Risk.
    retentionAmount = sumAtRisk * (retentionValue / 100);
  }

  // Ceded cannot be negative
  const sumCeded = Math.max(0, sumAtRisk - retentionAmount);
  return { sumAtRisk, retentionAmount, sumCeded };
};

/**
 * Calculates the reinsurance premium amount based on the provided formula:
 * Sum Ceded/1000 * [ (Model Factor * Premium Rate * (1 + EMR% - Selection Discount)) ] + (OtherExtraPremium / Premium Frequency)
 */
export const calculatePremiumAmount = (
  sumCeded: number,
  modelFactor: number,
  premiumRate: number,
  emrPercentage: number,
  selectionDiscountPercentage: number,
  otherExtraPremium: number,
  premiumFrequency: number
): number => {
  // Convert percentages to decimals
  const emr = emrPercentage / 100;
  const selDiscount = selectionDiscountPercentage / 100;

  const baseCalc = sumCeded / 1000;
  const rateMultiplier = modelFactor * premiumRate * (1 + emr - selDiscount);
  const extraDocs = otherExtraPremium / premiumFrequency;

  return (baseCalc * rateMultiplier) + extraDocs;
};
