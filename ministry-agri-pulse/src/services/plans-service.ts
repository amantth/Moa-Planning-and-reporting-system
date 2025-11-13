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
  try {
    console.log("Adding target to plan:", planId, "with data:", targetData);
    
    // Try multiple endpoints in sequence
    const endpoints = [
      `/annual-plans/${planId}/add_target/`,
      `/annual-plans/${planId}/targets/`,
      `/plans/${planId}/add-target/`,
      `/plans/${planId}/targets/`,
      `/annual-plans/${planId}/add-target`,  // without trailing slash
      `/plans/${planId}/add_target/`,
    ];
    
    let lastError;
    let attemptedEndpoints = [];
    
    for (const endpoint of endpoints) {
      try {
        console.log("Trying add target endpoint:", endpoint);
        const response = await apiClient.post(endpoint, targetData);
        console.log("Add target successful with endpoint:", endpoint);
        return response.data;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed with status:`, error.response?.status);
        console.log(`Error details:`, error.response?.data);
        lastError = error;
        attemptedEndpoints.push(`${endpoint} (${error.response?.status || 'network error'})`);
        
        // Continue trying other endpoints unless it's a permission error
        if (error.response?.status === 403 || error.response?.status === 401) {
          throw error;
        }
      }
    }
    
    // If all endpoints failed, create a comprehensive error
    console.log("All add target endpoints failed:", attemptedEndpoints);
    
    // Check if the error is a server crash (HTML response)
    if (lastError?.response?.data && typeof lastError.response.data === 'string' && 
        lastError.response.data.includes('<!DOCTYPE html>')) {
      const serverError = new Error(
        `Server error occurred while adding target. The backend returned an HTML error page instead of JSON. ` +
        `This indicates a server-side crash or configuration issue. Please check the server logs and contact your administrator.`
      );
      serverError.name = 'ServerCrashError';
      throw serverError;
    }
    
    // Create a comprehensive error with details about all attempts
    const comprehensiveError = new Error(
      `Failed to add target. Attempted endpoints: ${attemptedEndpoints.join(', ')}. ` +
      `The backend may not have the correct API endpoints for adding targets.`
    );
    comprehensiveError.name = 'AllTargetEndpointsFailed';
    throw comprehensiveError;
    
  } catch (error) {
    console.error("Add target service error:", error);
    throw error;
  }
};
