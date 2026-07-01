import { getSweepUser, requireProUserApi } from '@/lib/sweep-auth';
import { isGeneratedReportRequest } from '@/lib/finance-auth';

export { isGeneratedReportRequest };

export async function requireFinanceProApi() {
  return requireProUserApi();
}

export async function requireFinanceReportAuth() {
  return getSweepUser();
}
