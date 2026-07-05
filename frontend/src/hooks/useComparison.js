import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { comparisonService } from '../services/comparisonService.js';

export const useComparisons = () => {
  return useQuery({ queryKey: ['comparisons'], queryFn: comparisonService.list });
};

export const useComparison = (id) => {
  return useQuery({ queryKey: ['comparison', id], queryFn: () => comparisonService.get(id), enabled: Boolean(id) });
};

export const useRunComparison = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comparisonService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comparisons'] }),
  });
};

export const useDeleteComparison = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comparisonService.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comparisons'] }),
  });
};
