import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userKeyService } from '../services/userKeyService.js';

export const useMyApiKeys = () => useQuery({ queryKey: ['me', 'api-keys'], queryFn: userKeyService.list });

export const useUpdateMyApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userKeyService.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me', 'api-keys'] });
      qc.invalidateQueries({ queryKey: ['system-info'] });
    },
  });
};

export const useRequestKeyAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userKeyService.requestAccess,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'api-keys'] }),
  });
};
