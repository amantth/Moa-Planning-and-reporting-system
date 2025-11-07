import { apiClient } from "@/services/api-client";
import {
  QuarterlyReportSummary,
  mapQuarterlyReportSummary,
  ReportStatus,
} from "@/services/types";

export interface QuarterlyReportFilters {
  year?: number;
  quarter?: number;
  status?: ReportStatus;
}

export const getQuarterlyReports = async (
  filters: QuarterlyReportFilters = {}
): Promise<QuarterlyReportSummary[]> => {
  const params: Record<string, string | number> = {};
  if (filters.year) params.year = filters.year;
  if (filters.quarter) params.quarter = filters.quarter;
  if (filters.status) params.status = filters.status;

  const { data } = await apiClient.get("/quarterly-reports/", { params });
  return Array.isArray(data)
    ? data.map((item) => mapQuarterlyReportSummary(item))
    : [];
};
