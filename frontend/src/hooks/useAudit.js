import { useQuery } from '@tanstack/react-query';
import { auditService } from '../services/auditService.js';

export const useAuditTrail = () => {
  return useQuery({ queryKey: ['audit'], queryFn: auditService.trail });
}
