export type PaymentFrequency = 1 | 2 | 4 | 12;
export type Gender = 'Male' | 'Female' | 'Any';
export type RetentionType = 'absolute' | 'percentage';

export type GenderTarget = 'Male' | 'Female';
export type SmokerTarget = 'Smoker' | 'Non-Smoker';
export type MedicalTarget = 'Medical' | 'Non-Medical' | 'Tele-Medical';
export type ImpairmentTarget = 'Single' | 'Joint';
export type PaymentModeTarget = 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly' | 'Single';

export interface MappingEntry {
  id: string;
  sourceValue: string;
  targetValue: string;
}

export interface MasterConfig {
  genderMappings: MappingEntry[];
  smokerMappings: MappingEntry[];
  medicalMappings: MappingEntry[];
  impairmentMappings: MappingEntry[];
  paymentModeMappings: MappingEntry[];
}

export interface ModelFactorEntry {
  id: string;
  frequency: PaymentFrequency;
  factor: number;
}

export interface PremiumRateEntry {
  id: string;
  riskCoverage: string;
  ageMin: number;
  ageMax: number;
  gender: Gender;
  rate: number;
}

export interface ReinsurerShare {
  id: string;
  name: string;
  sharePercentage: number;
}

export interface Treaty {
  id: string;
  name: string;
  retentionType: RetentionType;
  retentionValue: number;
  modelFactors: ModelFactorEntry[];
  premiumRates: PremiumRateEntry[];
  reinsurers: ReinsurerShare[];
}

export interface PolicyInput {
  sumAssured: number;
  grossReserves: number;
  age: number;
  gender: Gender;
  riskCoverage: string;
  reinsurerPaymentFrequency: PaymentFrequency;
  emrPercentage: number;
  selectionDiscountPercentage: number;
  otherExtraPremium: number;
  policyholderPremiumFrequency: number;
}

export interface SavedPolicy {
  id: string;
  actualCessionNo: number | null;
  customerId: string;
  policyNumber: string;
  policyHolderName: string;
  dateOfCommencement: string;
  dob: string;
  gender: string;
  age: number;
  riskCoverage: string;
  sumAssured: string;
  smoker: string;
  medical: string;
  impairment: string;
  
  selectedTreatyId: string;
  treatyName: string;
  grossReserves: string;

  emrPercentage: string;
  selectionDiscount: string;
  otherExtraPremium: string;
  reinsurerPaymentFrequency: PaymentFrequency;
  policyholderPremiumFrequency: PaymentFrequency;

  sumAtRisk: number;
  sumCeded: number;
  premiumRate: number | null;
  modelFactor: number | null;
  premiumAmount: number | null;
}
