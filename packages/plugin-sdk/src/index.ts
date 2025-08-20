import type { UXSpec } from 'flowlock-uxspec';

export type CheckLevel = 'error' | 'warning' | 'info';
export type CheckStatus = 'pass' | 'fail' | 'skip';

export interface CheckResult {
  id: string;
  level: CheckLevel;
  status: CheckStatus;
  message: string;
  ref?: string;
  details?: Record<string, any>;
}

export interface FlowlockCheck {
  id: string;
  name: string;
  description: string;
  run(spec: UXSpec): CheckResult | CheckResult[] | Promise<CheckResult | CheckResult[]>;
}

export interface CheckContext {
  spec: UXSpec;
  config?: Record<string, unknown>;
}