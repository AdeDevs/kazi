import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gigApi } from '../lib/apiClient';
import { GigCreate, GigResponse, GigUpdate, ApiFilterParams } from '../types/api';

export const GIGS_LIST_KEY = ['gigs', 'list'];
export const GIGS_MY_KEY = ['gigs', 'my'];
export const GIG_DETAIL_KEY = ['gigs', 'detail'];

export function useListGigs(params?: ApiFilterParams) {
  return useQuery<GigResponse[], Error>({
    queryKey: [...GIGS_LIST_KEY, params],
    queryFn: () => gigApi.listGigs(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyGigs(enabled: boolean = true) {
  return useQuery<GigResponse[], Error>({
    queryKey: GIGS_MY_KEY,
    queryFn: gigApi.getMyGigs,
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useGigDetails(gigId: string, enabled: boolean = true) {
  return useQuery<GigResponse, Error>({
    queryKey: [...GIG_DETAIL_KEY, gigId],
    queryFn: () => gigApi.getGigById(gigId),
    enabled: Boolean(gigId) && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GigCreate) => gigApi.createGig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GIGS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: GIGS_MY_KEY });
    },
  });
}

export function useUpdateGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gigId, payload }: { gigId: string; payload: GigUpdate }) =>
      gigApi.updateGig(gigId, payload),
    onSuccess: (_, { gigId }) => {
      queryClient.invalidateQueries({ queryKey: [...GIG_DETAIL_KEY, gigId] });
      queryClient.invalidateQueries({ queryKey: GIGS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: GIGS_MY_KEY });
    },
  });
}

export function useDeleteGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gigId: string) => gigApi.deleteGig(gigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GIGS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: GIGS_MY_KEY });
    },
  });
}
