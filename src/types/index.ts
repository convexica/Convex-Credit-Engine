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
  price: number; // Price as % of par (e.g., 100 for par)
}

export interface Scenario {
  cpr: number; // Constant Prepayment Rate (%)
  cdr: number; // Constant Default Rate (%)
  severity: number; // Loss Severity / (1 - Recovery Rate) (%)
  delinquencyLag: number; // Months
  servicingFee: number; // Annual Servicing Fee (%)
  recoveryLag: number; // Months to Recovery
  turboTriggerPct?: number; // Cumulative Default % that triggers Senior Principal Redirection
}

export interface CashFlowPeriod {
  period: number;
  poolBalanceStart: number;
  poolBalanceEnd: number;
  poolInterest: number;
  poolPrincipal: number; // Scheduled + Prepay
  poolDefaultAmount: number;
  poolLoss: number;
  poolRecovery: number;
  excessSpread: number; // Residual cash after all collections and fees
  
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