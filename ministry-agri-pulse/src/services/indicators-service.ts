import { apiClient } from "@/services/api-client";
import { IndicatorSummary, mapIndicatorSummary } from "@/services/types";

export interface IndicatorFilters {
  unitId?: number;
  search?: string;
  includeInactive?: boolean;
}

export interface CreateIndicatorData {
  code: string;
  name: string;
  description?: string;
  owner_unit_id: number;
  unit_of_measure?: string;
  active?: boolean;
}

export interface UpdateIndicatorData {
  code?: string;
  name?: string;
  description?: string;
  owner_unit_id?: number;
  unit_of_measure?: string;
  active?: boolean;
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

export const getIndicator = async (id: number): Promise<IndicatorSummary> => {
  const { data } = await apiClient.get(`/indicators/${id}/`);
  return mapIndicatorSummary(data);
};

export const createIndicator = async (indicatorData: CreateIndicatorData): Promise<IndicatorSummary> => {
  const { data } = await apiClient.post("/indicators/", indicatorData);
  return mapIndicatorSummary(data);
};

export const updateIndicator = async (id: number, indicatorData: UpdateIndicatorData): Promise<IndicatorSummary> => {
  const { data } = await apiClient.put(`/indicators/${id}/`, indicatorData);
  return mapIndicatorSummary(data);
};

export const deleteIndicator = async (id: number): Promise<void> => {
  await apiClient.delete(`/indicators/${id}/`);
};
