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

export interface CreateQuarterlyReportData {
  year: number;
  quarter: number;
  unit_id: number;
}

export interface UpdateQuarterlyReportData {
  year?: number;
  quarter?: number;
  unit_id?: number;
  status?: ReportStatus;
}

export interface CreateQuarterlyEntryData {
  report_id: number;
  indicator_id: number;
  achieved_value: number;
  remarks?: string;
  evidence_file?: File;
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

export const getQuarterlyReport = async (id: number): Promise<any> => {
  const { data } = await apiClient.get(`/quarterly-reports/${id}/`);
  return data;
};

export const createQuarterlyReport = async (reportData: CreateQuarterlyReportData): Promise<any> => {
  const { data } = await apiClient.post("/quarterly-reports/", reportData);
  return data;
};

export const updateQuarterlyReport = async (id: number, reportData: UpdateQuarterlyReportData): Promise<any> => {
  const { data } = await apiClient.put(`/quarterly-reports/${id}/`, reportData);
  return data;
};

export const deleteQuarterlyReport = async (id: number): Promise<void> => {
  await apiClient.delete(`/quarterly-reports/${id}/`);
};

export const submitQuarterlyReport = async (id: number): Promise<any> => {
  const { data } = await apiClient.post(`/quarterly-reports/${id}/submit/`);
  return data;
};

export const approveQuarterlyReport = async (id: number): Promise<any> => {
  const { data } = await apiClient.post(`/quarterly-reports/${id}/approve/`);
  return data;
};

export const rejectQuarterlyReport = async (id: number): Promise<any> => {
  const { data } = await apiClient.post(`/quarterly-reports/${id}/reject/`);
  return data;
};

export const addQuarterlyEntry = async (reportId: number, entryData: CreateQuarterlyEntryData): Promise<any> => {
  const formData = new FormData();
  formData.append("indicator_id", String(entryData.indicator_id));
  formData.append("achieved_value", String(entryData.achieved_value));
  if (entryData.remarks) formData.append("remarks", entryData.remarks);
  if (entryData.evidence_file) formData.append("evidence_file", entryData.evidence_file);

  const { data } = await apiClient.post(`/quarterly-reports/${reportId}/add_entry/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};
