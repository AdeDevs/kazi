import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../lib/apiClient';
import { VerificationSubmit, VerificationResponse, VerificationReview } from '../types/api';

export const VERIFICATION_STATUS_KEY = ['verification', 'status'];

export function useVerificationStatus(enabled: boolean = true) {
  return useQuery<VerificationResponse, Error>({
    queryKey: VERIFICATION_STATUS_KEY,
    queryFn: verificationApi.getVerificationStatus,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: VerificationSubmit) => verificationApi.submitVerification(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(VERIFICATION_STATUS_KEY, data);
    },
  });
}

export function useReviewVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      verificationId,
      payload,
    }: {
      verificationId: string;
      payload: VerificationReview;
    }) => verificationApi.reviewVerification(verificationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERIFICATION_STATUS_KEY });
    },
  });
}
