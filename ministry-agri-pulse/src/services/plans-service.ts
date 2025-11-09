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

export interface CreateAnnualPlanData {
  year: number;
  unit_id: number;
}

export interface UpdateAnnualPlanData {
  year?: number;
  unit_id?: number;
  status?: PlanStatus;
}

export interface CreateAnnualPlanTargetData {
  plan_id: number;
  indicator_id: number;
  target_value: number;
  baseline_value?: number;
  remarks?: string;
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

export const getAnnualPlan = async (id: number): Promise<any> => {
  const { data } = await apiClient.get(`/annual-plans/${id}/`);
  return data;
};

export const createAnnualPlan = async (planData: CreateAnnualPlanData): Promise<any> => {
  const { data } = await apiClient.post("/annual-plans/", planData);
  return data;
};

export const updateAnnualPlan = async (id: number, planData: UpdateAnnualPlanData): Promise<any> => {
  const { data } = await apiClient.put(`/annual-plans/${id}/`, planData);
  return data;
};

export const deleteAnnualPlan = async (id: number): Promise<void> => {
  await apiClient.delete(`/annual-plans/${id}/`);
};

export const submitAnnualPlan = async (id: number): Promise<any> => {
  const { data } = await apiClient.post(`/annual-plans/${id}/submit/`);
  return data;
};

export const approveAnnualPlan = async (id: number): Promise<any> => {
  const { data } = await apiClient.post(`/annual-plans/${id}/approve/`);
  return data;
};

export const rejectAnnualPlan = async (id: number): Promise<any> => {
  const { data } = await apiClient.post(`/annual-plans/${id}/reject/`);
  return data;
};

export const addAnnualPlanTarget = async (planId: number, targetData: CreateAnnualPlanTargetData): Promise<any> => {
  const { data } = await apiClient.post(`/annual-plans/${planId}/add_target/`, targetData);
  return data;
};
