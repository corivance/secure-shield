import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { disputeService } from '../services/disputeService.js';

export const useDispute = (id, { poll = false } = {}) => {
  return useQuery({
    queryKey: ['dispute', id],
    queryFn: () => disputeService.get(id),
    enabled: Boolean(id),
    refetchInterval: poll ? 2500 : false,
  });
}

export const useStartDispute = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disputeService.create,
    onSuccess: (dispute) => qc.setQueryData(['dispute', dispute.id || dispute._id], dispute),
  });
}

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async (filename) => {
      const blob = await disputeService.downloadBlob(filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    },
  });
}
