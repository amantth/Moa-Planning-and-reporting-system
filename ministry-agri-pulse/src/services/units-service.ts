import { apiClient } from "@/services/api-client";
import { UnitSummary, mapUnitSummary } from "@/services/types";

export interface CreateUnitData {
  name: string;
  type: string;
  parent?: number | null;
}

export interface UpdateUnitData {
  name?: string;
  type?: string;
  parent?: number | null;
}

export const getUnits = async (): Promise<UnitSummary[]> => {
  const { data } = await apiClient.get("/units/");
  return Array.isArray(data) ? data.map((item) => mapUnitSummary(item)) : [];
};

export const getUnit = async (id: number): Promise<UnitSummary> => {
  const { data } = await apiClient.get(`/units/${id}/`);
  return mapUnitSummary(data);
};

export const createUnit = async (unitData: CreateUnitData): Promise<UnitSummary> => {
  try {
    console.log("Creating unit with data:", unitData);
    const { data } = await apiClient.post("/units/", unitData);
    console.log("Create unit response:", data);
    return mapUnitSummary(data);
  } catch (error) {
    console.error("Create unit service error:", error);
    throw error;
  }
};

export const updateUnit = async (id: number, unitData: UpdateUnitData): Promise<UnitSummary> => {
  const { data } = await apiClient.put(`/units/${id}/`, unitData);
  return mapUnitSummary(data);
};

export const deleteUnit = async (id: number, cascade: boolean = false): Promise<void> => {
  try {
    const url = cascade ? `/units/${id}/?cascade=true` : `/units/${id}/`;
    console.log("Deleting unit with URL:", url);
    const response = await apiClient.delete(url);
    console.log("Delete unit response:", response);
    return response.data;
  } catch (error: any) {
    console.error("Delete unit service error:", error);
    console.error("Error response:", error.response);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);
    
    // Check if it's a server crash (HTML response)
    if (error.response?.data && typeof error.response.data === 'string' && 
        error.response.data.includes('<!DOCTYPE html>')) {
      const serverError = new Error(
        `Server crashed while deleting office. The backend returned an HTML error page instead of JSON. ` +
        `This indicates a server-side crash, likely due to foreign key constraints or associated data.`
      );
      serverError.name = 'ServerCrashError';
      throw serverError;
    }
    
    throw error;
  }
};

export const manuallyRemoveDependencies = async (id: number): Promise<void> => {
  try {
    console.log("Manually removing dependencies for unit:", id);
    
    // Step 1: Try to reassign users to a default unit or remove their unit assignment
    try {
      const usersResponse = await apiClient.get("/users/", { params: { unit: id } });
      if (Array.isArray(usersResponse.data) && usersResponse.data.length > 0) {
        console.log(`Found ${usersResponse.data.length} users to reassign`);
        
        // Try to reassign users to null/no unit
        for (const user of usersResponse.data) {
          try {
            await apiClient.put(`/users/${user.id}/`, { unit: null });
            console.log(`Reassigned user ${user.id} from unit ${id}`);
          } catch (userError) {
            console.log(`Could not reassign user ${user.id}:`, userError);
          }
        }
      }
    } catch (userError) {
      console.log("Could not check/reassign users:", userError);
    }
    
    // Step 2: Try to delete or reassign plans
    try {
      const plansResponse = await apiClient.get("/annual-plans/", { params: { unit: id } });
      if (Array.isArray(plansResponse.data) && plansResponse.data.length > 0) {
        console.log(`Found ${plansResponse.data.length} plans to handle`);
        
        for (const plan of plansResponse.data) {
          try {
            // Try to delete draft plans, reassign others
            if (plan.status === 'DRAFT') {
              await apiClient.delete(`/annual-plans/${plan.id}/`);
              console.log(`Deleted draft plan ${plan.id}`);
            } else {
              // Try to reassign to a parent unit or mark as orphaned
              await apiClient.put(`/annual-plans/${plan.id}/`, { unit: null });
              console.log(`Reassigned plan ${plan.id}`);
            }
          } catch (planError) {
            console.log(`Could not handle plan ${plan.id}:`, planError);
          }
        }
      }
    } catch (planError) {
      console.log("Could not check/handle plans:", planError);
    }
    
    // Step 3: Try to delete or reassign reports
    try {
      const reportsResponse = await apiClient.get("/quarterly-reports/", { params: { unit: id } });
      if (Array.isArray(reportsResponse.data) && reportsResponse.data.length > 0) {
        console.log(`Found ${reportsResponse.data.length} reports to handle`);
        
        for (const report of reportsResponse.data) {
          try {
            // Try to delete draft reports, reassign others
            if (report.status === 'DRAFT') {
              await apiClient.delete(`/quarterly-reports/${report.id}/`);
              console.log(`Deleted draft report ${report.id}`);
            } else {
              await apiClient.put(`/quarterly-reports/${report.id}/`, { unit: null });
              console.log(`Reassigned report ${report.id}`);
            }
          } catch (reportError) {
            console.log(`Could not handle report ${report.id}:`, reportError);
          }
        }
      }
    } catch (reportError) {
      console.log("Could not check/handle reports:", reportError);
    }
    
    // Step 4: Try to reassign child units
    try {
      const unitsResponse = await apiClient.get("/units/");
      if (Array.isArray(unitsResponse.data)) {
        const childUnits = unitsResponse.data.filter((unit: any) => unit.parent === id);
        console.log(`Found ${childUnits.length} child units to reassign`);
        
        for (const childUnit of childUnits) {
          try {
            await apiClient.put(`/units/${childUnit.id}/`, { parent: null });
            console.log(`Reassigned child unit ${childUnit.id}`);
          } catch (childError) {
            console.log(`Could not reassign child unit ${childUnit.id}:`, childError);
          }
        }
      }
    } catch (unitError) {
      console.log("Could not check/reassign child units:", unitError);
    }
    
    console.log("Finished attempting to remove dependencies");
  } catch (error) {
    console.error("Error during manual dependency removal:", error);
    throw error;
  }
};

export const forceDeleteUnit = async (id: number): Promise<void> => {
  try {
    // Try different cascade deletion approaches
    const endpoints = [
      `/units/${id}/?cascade=true`,
      `/units/${id}/?force=true`,
      `/units/${id}/force-delete/`,
      `/units/${id}/cascade-delete/`,
      `/units/${id}/delete-with-dependencies/`,
      `/api/units/${id}/cascade/`
    ];
    
    let lastError;
    let attemptedEndpoints = [];
    
    for (const endpoint of endpoints) {
      try {
        console.log("Trying force delete endpoint:", endpoint);
        const response = await apiClient.delete(endpoint);
        console.log("Force delete successful with endpoint:", endpoint);
        return response.data;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed with status:`, error.response?.status);
        console.log(`Error details:`, error.response?.data);
        lastError = error;
        attemptedEndpoints.push(`${endpoint} (${error.response?.status || 'network error'})`);
        
        // Continue trying other endpoints even if this one returns 500
        // Only stop if it's a 403 (forbidden) or 401 (unauthorized)
        if (error.response?.status === 403 || error.response?.status === 401) {
          throw error;
        }
      }
    }
    
    // If all cascade endpoints failed, try manual dependency removal as a last resort
    console.log("All force delete endpoints failed:", attemptedEndpoints);
    console.log("Attempting manual dependency removal as fallback...");
    
    try {
      // Try to manually remove dependencies
      await manuallyRemoveDependencies(id);
      
      // After removing dependencies, try regular deletion
      console.log("Dependencies removed, attempting regular deletion...");
      await deleteUnit(id);
      
      console.log("Manual dependency removal and deletion successful!");
      return;
      
    } catch (manualError) {
      console.error("Manual dependency removal also failed:", manualError);
      
      // Create a comprehensive error with details about all attempts
      const comprehensiveError = new Error(
        `All deletion methods failed. Cascade endpoints tried: ${attemptedEndpoints.join(', ')}. ` +
        `Manual dependency removal also failed. The office may have complex dependencies that require manual intervention.`
      );
      comprehensiveError.name = 'AllDeletionMethodsFailed';
      throw comprehensiveError;
    }
    
  } catch (error) {
    console.error("Force delete unit service error:", error);
    throw error;
  }
};
