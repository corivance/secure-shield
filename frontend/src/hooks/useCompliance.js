import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { complianceService } from '../services/complianceService.js';
import { apiClient } from '../lib/apiClient.js';
import { ENDPOINTS } from '../constants/apiEndpoints.js';

// Compliance content in the user's current language. The query key includes the
// language so switching languages refetches the translated content.
export const useComplianceRegulations = () => {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'en';
  return useQuery({
    queryKey: ['compliance', 'regulations', lang],
    queryFn: () => complianceService.list(lang),
  });
};

// Admin: save a corrected translation for a compliance field.
export const useSaveTranslation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const r = await apiClient.patch(ENDPOINTS.admin.translations, payload);
      return r.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'regulations'] }),
  });
};
