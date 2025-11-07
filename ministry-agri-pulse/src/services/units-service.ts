import { apiClient } from "@/services/api-client";
import { UnitSummary, mapUnitSummary } from "@/services/types";

export const getUnits = async (): Promise<UnitSummary[]> => {
  const { data } = await apiClient.get("/units/");
  return Array.isArray(data) ? data.map((item) => mapUnitSummary(item)) : [];
};
