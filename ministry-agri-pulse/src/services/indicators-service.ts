import { apiClient } from "@/services/api-client";
import { IndicatorSummary, mapIndicatorSummary } from "@/services/types";

export interface IndicatorFilters {
  unitId?: number;
  search?: string;
  includeInactive?: boolean;
}

export const getIndicators = async (
  filters: IndicatorFilters = {}
): Promise<IndicatorSummary[]> => {
  const params: Record<string, string | number | boolean> = {};
  if (filters.unitId) params.owner_unit = filters.unitId;
  if (filters.search) params.search = filters.search;
  if (filters.includeInactive)
    params.include_inactive = filters.includeInactive;

  const { data } = await apiClient.get("/indicators/", { params });
  return Array.isArray(data)
    ? data.map((item) => mapIndicatorSummary(item))
    : [];
};
