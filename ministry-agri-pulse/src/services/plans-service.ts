import { apiClient } from "@/services/api-client";
import {
  AnnualPlanSummary,
  mapAnnualPlanSummary,
  PlanStatus,
} from "@/services/types";

export interface AnnualPlanFilters {
  year?: number;
  unitId?: number;
  status?: PlanStatus;
}

export const getAnnualPlans = async (
  filters: AnnualPlanFilters = {}
): Promise<AnnualPlanSummary[]> => {
  const params: Record<string, string | number> = {};
  if (filters.year) params.year = filters.year;
  if (filters.unitId) params.unit = filters.unitId;
  if (filters.status) params.status = filters.status;

  const { data } = await apiClient.get("/annual-plans/", { params });
  return Array.isArray(data)
    ? data.map((item) => mapAnnualPlanSummary(item))
    : [];
};
