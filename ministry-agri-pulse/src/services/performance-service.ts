import { apiClient } from "@/services/api-client";

export interface PerformanceData {
  id?: number;
  indicator_id: number;
  year: number;
  quarter: number;
  plan_value: number | null;
  performance_value: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePerformanceData {
  indicator_id: number;
  year: number;
  quarter: number;
  plan_value?: number;
  performance_value?: number;
}

export interface UpdatePerformanceData {
  plan_value?: number;
  performance_value?: number;
}

export interface PerformanceFilters {
  year?: number;
  quarter?: number;
  indicator_id?: number;
}

export const getPerformanceData = async (
  filters: PerformanceFilters = {}
): Promise<PerformanceData[]> => {
  const params: Record<string, string | number> = {};
  if (filters.year) params.year = filters.year;
  if (filters.quarter) params.quarter = filters.quarter;
  if (filters.indicator_id) params.indicator_id = filters.indicator_id;

  const { data } = await apiClient.get("/performance-data/", { params });
  return Array.isArray(data) ? data : [];
};

export const getPerformanceDataById = async (id: number): Promise<PerformanceData> => {
  const { data } = await apiClient.get(`/performance-data/${id}/`);
  return data;
};

export const createPerformanceData = async (
  performanceData: CreatePerformanceData
): Promise<PerformanceData> => {
  const { data } = await apiClient.post("/performance-data/", performanceData);
  return data;
};

export const updatePerformanceData = async (
  id: number,
  performanceData: UpdatePerformanceData
): Promise<PerformanceData> => {
  const { data } = await apiClient.put(`/performance-data/${id}/`, performanceData);
  return data;
};

export const deletePerformanceData = async (id: number): Promise<void> => {
  await apiClient.delete(`/performance-data/${id}/`);
};

export const bulkUpdatePerformanceData = async (
  updates: Array<{ id?: number } & CreatePerformanceData>
): Promise<PerformanceData[]> => {
  const { data } = await apiClient.post("/performance-data/bulk-update/", { updates });
  return data;
};

export const exportPerformanceData = async (
  filters: PerformanceFilters = {}
): Promise<Blob> => {
  const params: Record<string, string | number> = {};
  if (filters.year) params.year = filters.year;
  if (filters.quarter) params.quarter = filters.quarter;
  if (filters.indicator_id) params.indicator_id = filters.indicator_id;

  const response = await apiClient.get("/performance-data/export/", {
    params,
    responseType: 'blob',
  });
  return response.data;
};
