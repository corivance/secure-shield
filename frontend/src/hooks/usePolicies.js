import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { policyService } from '../services/policyService.js';

export const usePolicies = () => {
  return useQuery({ queryKey: ['policies'], queryFn: policyService.list });
}

export const usePolicy = (id) => {
  return useQuery({ queryKey: ['policy', id], queryFn: () => policyService.get(id), enabled: Boolean(id) });
}

export const useUploadPolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: policyService.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export const useUpdatePolicyRules = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => policyService.update(id, data),
    onSuccess: (policy) => {
      qc.setQueryData(['policy', id], policy);
      qc.invalidateQueries({ queryKey: ['policies'] });
    },
  });
}

export const useDeletePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: policyService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['policies'] }),
  });
}
