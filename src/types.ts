export enum TrancheType {
  SENIOR = 'Senior',
  MEZZANINE = 'Mezzanine',
  EQUITY = 'Equity/First Loss',
}

export enum PaymentFrequency {
  MONTHLY = 12,
  QUARTERLY = 4,
}

export interface AssetPool {
  principalBalance: number;
  wac: number; // Weighted Average Coupon (%)
  wam: number; // Weighted Average Maturity (months)
  paymentFrequency: PaymentFrequency;
}

export interface Tranche {
  id: string;
  name: string;
  type: TrancheType;
  originalBalance: number;
  currentBalance: number;
  coupon: number; // Interest rate (%)
  spread: number; // Spread over benchmark (bps)
  rating: string;
  description?: string;
}

export interface Scenario {
  cpr: number; // Constant Prepayment Rate (%)
  cdr: number; // Constant Default Rate (%)
  severity: number; // Loss Severity / (1 - Recovery Rate) (%)
  delinquencyLag: number; // Months
}

export interface CashFlowPeriod {
  period: number;
  poolBalanceStart: number;
  poolInterest: number;
  poolPrincipal: number; // Scheduled + Prepay
  poolDefaultAmount: number;
  poolLoss: number;
  poolRecovery: number;
  
  trancheCashflows: Record<string, {
    interest: number;
    principal: number;
    balanceEnd: number;
    loss: number;
  }>;
}

export interface DealMetrics {
  wal: number; // Weighted Average Life
  yield: number;
  totalCashflow: number;
  lossCoverage: number;
}