import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eligibilityService } from '../services/eligibilityService.js';

export const useHistory = () => {
  return useQuery({ queryKey: ['history'], queryFn: eligibilityService.history });
}

export const useCheck = (id) => {
  return useQuery({ queryKey: ['check', id], queryFn: () => eligibilityService.get(id), enabled: Boolean(id) });
}

export const useRunCheck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: eligibilityService.check,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
