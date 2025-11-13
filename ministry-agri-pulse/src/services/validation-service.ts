import { apiClient } from "@/services/api-client";

export interface DeletionValidation {
  canDelete: boolean;
  reason?: string;
  dependencies?: string[];
}

export const validateIndicatorDeletion = async (indicatorId: number): Promise<DeletionValidation> => {
  try {
    const { data } = await apiClient.get(`/indicators/${indicatorId}/can-delete/`);
    return data;
  } catch (error: any) {
    // If the endpoint doesn't exist, assume we can try to delete
    if (error.response?.status === 404) {
      return { canDelete: true };
    }
    throw error;
  }
};

export const validateOfficeDeletion = async (officeId: number): Promise<DeletionValidation> => {
  try {
    const { data } = await apiClient.get(`/units/${officeId}/can-delete/`);
    return data;
  } catch (error: any) {
    // If the endpoint doesn't exist, assume we can try to delete
    if (error.response?.status === 404) {
      return { canDelete: true };
    }
    throw error;
  }
};

export const checkIndicatorUsage = async (indicatorId: number): Promise<{
  usedInPlans: number;
  usedInReports: number;
  usedInPerformanceData: number;
}> => {
  try {
    const { data } = await apiClient.get(`/indicators/${indicatorId}/usage/`);
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, return zero usage
    if (error.response?.status === 404) {
      return { usedInPlans: 0, usedInReports: 0, usedInPerformanceData: 0 };
    }
    throw error;
  }
};

export const checkOfficeUsage = async (officeId: number): Promise<{
  hasUsers: number;
  hasPlans: number;
  hasReports: number;
  hasChildOffices: number;
}> => {
  try {
    // Try the dedicated usage endpoint first
    const { data } = await apiClient.get(`/units/${officeId}/usage/`);
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, manually check using existing endpoints
    if (error.response?.status === 404) {
      console.log("Usage endpoint not found, checking manually...");
      
      try {
        // Check for child offices
        const unitsResponse = await apiClient.get("/units/");
        const childOffices = Array.isArray(unitsResponse.data) 
          ? unitsResponse.data.filter((unit: any) => unit.parent === officeId).length 
          : 0;

        // Check for plans
        let plansCount = 0;
        try {
          const plansResponse = await apiClient.get("/annual-plans/", { 
            params: { unit: officeId } 
          });
          plansCount = Array.isArray(plansResponse.data) ? plansResponse.data.length : 0;
        } catch (planError) {
          console.log("Could not check plans:", planError);
        }

        // Check for reports
        let reportsCount = 0;
        try {
          const reportsResponse = await apiClient.get("/quarterly-reports/", { 
            params: { unit: officeId } 
          });
          reportsCount = Array.isArray(reportsResponse.data) ? reportsResponse.data.length : 0;
        } catch (reportError) {
          console.log("Could not check reports:", reportError);
        }

        // Check for users (if endpoint exists)
        let usersCount = 0;
        try {
          const usersResponse = await apiClient.get("/users/", { 
            params: { unit: officeId } 
          });
          usersCount = Array.isArray(usersResponse.data) ? usersResponse.data.length : 0;
        } catch (userError) {
          console.log("Could not check users:", userError);
          // If we can't check users, assume there might be some
          usersCount = 1; // Conservative assumption
        }

        return {
          hasUsers: usersCount,
          hasPlans: plansCount,
          hasReports: reportsCount,
          hasChildOffices: childOffices,
        };
      } catch (manualCheckError) {
        console.error("Manual usage check failed:", manualCheckError);
        // Conservative approach - assume there are dependencies
        return { hasUsers: 1, hasPlans: 1, hasReports: 1, hasChildOffices: 0 };
      }
    }
    throw error;
  }
};
