import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../lib/apiClient';
import { ProfileCreate, ProfileResponse, ProfileUpdate } from '../types/api';

export const PROFILE_MY_KEY = ['profile', 'me'];
export const PROFILES_ALL_KEY = ['profiles', 'all'];

export function useMyProfile(enabled: boolean = true) {
  return useQuery<ProfileResponse, Error>({
    queryKey: PROFILE_MY_KEY,
    queryFn: profileApi.getMyProfile,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useListProfiles(params?: { category?: string; limit?: number }) {
  return useQuery<ProfileResponse[], Error>({
    queryKey: [...PROFILES_ALL_KEY, params],
    queryFn: () => profileApi.listProfiles(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateOrUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileCreate) => profileApi.createOrUpdateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_MY_KEY, data);
      queryClient.invalidateQueries({ queryKey: PROFILES_ALL_KEY });
    },
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileUpdate) => profileApi.updateMyProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_MY_KEY, data);
      queryClient.invalidateQueries({ queryKey: PROFILES_ALL_KEY });
    },
  });
}

export function useDeleteMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileApi.deleteMyProfile(),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: PROFILE_MY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILES_ALL_KEY });
    },
  });
}
