import { useMutation, useQuery } from '@tanstack/react-query';
import { systemService } from '../services/systemService.js';

export const useSystemInfo = () => {
  return useQuery({ queryKey: ['system-info'], queryFn: systemService.info });
}

export const useFetchApiKey = () => {
  return useMutation({ mutationFn: systemService.fetchApiKey });
}
