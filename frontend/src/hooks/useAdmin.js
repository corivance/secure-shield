import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService.js';

// ── Plans ──
export const useAdminPlans = () => useQuery({ queryKey: ['admin', 'plans'], queryFn: adminService.listPlans });

const planMutation = (fn) => () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'plans'] });
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};
export const useCreatePlan = planMutation(adminService.createPlan);
export const useUpdatePlan = planMutation(adminService.updatePlan);
export const useDeletePlan = planMutation(adminService.deletePlan);

// ── API keys ──
export const useApiKeys = () => useQuery({ queryKey: ['admin', 'api-keys'], queryFn: adminService.listApiKeys });

export const useUpdateApiKey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateApiKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'api-keys'] });
      qc.invalidateQueries({ queryKey: ['system-info'] });
    },
  });
};

// ── Users ──
export const useAdminUsers = () =>
  useQuery({ queryKey: ['admin', 'users'], queryFn: adminService.listUsers });

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

// ── Regulations ──
export const useAdminRegulations = () =>
  useQuery({ queryKey: ['admin', 'regulations'], queryFn: adminService.listRegulations });

export const useCreateRegulation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.createRegulation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'regulations'] }),
  });
};

export const useUpdateRegulation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.updateRegulation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'regulations'] }),
  });
};

export const useDeleteRegulation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.deleteRegulation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'regulations'] }),
  });
};

export const useExtractCircular = () => useMutation({ mutationFn: adminService.extractCircular });

export const useInsertCirculars = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminService.insertCirculars,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'regulations'] });
      qc.invalidateQueries({ queryKey: ['compliance', 'regulations'] });
    },
  });
};

// Expensive grounded-LLM call — only runs when `enabled` (i.e. the modal opens).
export const useRegulationUpdates = (enabled) =>
  useQuery({
    queryKey: ['admin', 'regulation-updates'],
    queryFn: adminService.fetchRegulationUpdates,
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
