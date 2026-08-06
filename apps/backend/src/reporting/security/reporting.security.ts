import { ReportQueryPayload } from '../contracts/reporting.contracts';

export class ReportingSecurity {
  public static applyTenantIsolation(payload: ReportQueryPayload): ReportQueryPayload {
    const securedFilters = { ...payload.filters };
    if (payload.tenantId) {
      securedFilters.tenantId = payload.tenantId;
    }
    return {
      ...payload,
      filters: securedFilters,
    };
  }
}
