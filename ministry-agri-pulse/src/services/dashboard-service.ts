import { apiClient } from "@/services/api-client";
import {
  DashboardStats,
  PerformanceSummary,
  WorkflowAuditEntry,
  AnnualPlanSummary,
  mapAnnualPlanSummary,
  mapDashboardStats,
  mapPerformanceSummary,
  mapWorkflowAuditEntry,
} from "@/services/types";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get("/dashboard/stats/");
  return mapDashboardStats(data);
};

export const getRecentActivities = async (): Promise<WorkflowAuditEntry[]> => {
  const { data } = await apiClient.get("/dashboard/recent_activities/");
  return Array.isArray(data)
    ? data.map((item) => mapWorkflowAuditEntry(item))
    : [];
};

export const getPendingApprovals = async (): Promise<AnnualPlanSummary[]> => {
  const { data } = await apiClient.get("/dashboard/pending_approvals/");
  return Array.isArray(data)
    ? data.map((item) => mapAnnualPlanSummary(item))
    : [];
};

export const getPerformanceSummary = async (
  year?: number
): Promise<PerformanceSummary> => {
  const params = year ? { year } : undefined;
  const { data } = await apiClient.get("/dashboard/performance_summary/", {
    params,
  });
  return mapPerformanceSummary(data);
};
