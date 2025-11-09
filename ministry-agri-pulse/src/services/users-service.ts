import { apiClient } from "@/services/api-client";
import { UserSummary, UserProfileSummary, mapUserSummary, mapUserProfileSummary, UnitSummary } from "@/services/types";

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  unit_id: number;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
  role?: string;
  unit_id?: number;
}

export interface UserWithProfile {
  user: UserSummary;
  profile: UserProfileSummary;
}

export const getUsers = async (): Promise<UserWithProfile[]> => {
  const { data } = await apiClient.get("/users/list-with-profiles/");
  return Array.isArray(data)
    ? data.map((item: any) => ({
        user: mapUserSummary(item.user || item),
        profile: item.profile ? mapUserProfileSummary(item.profile) : null,
      }))
    : [];
};

export const createUser = async (userData: CreateUserData): Promise<UserWithProfile> => {
  const { data } = await apiClient.post("/users/create-user/", userData);
  return {
    user: mapUserSummary(data.user),
    profile: mapUserProfileSummary(data.profile),
  };
};

export const updateUser = async (userId: number, userData: UpdateUserData): Promise<UserWithProfile> => {
  const { data } = await apiClient.put(`/users/${userId}/update-user/`, userData);
  return {
    user: mapUserSummary(data.user),
    profile: mapUserProfileSummary(data.profile),
  };
};

export const deleteUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/users/${userId}/delete-user/`);
};

