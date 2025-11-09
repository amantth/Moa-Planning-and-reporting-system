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
  const { data } = await apiClient.post("/units/", unitData);
  return mapUnitSummary(data);
};

export const updateUnit = async (id: number, unitData: UpdateUnitData): Promise<UnitSummary> => {
  const { data } = await apiClient.put(`/units/${id}/`, unitData);
  return mapUnitSummary(data);
};

export const deleteUnit = async (id: number): Promise<void> => {
  await apiClient.delete(`/units/${id}/`);
};
