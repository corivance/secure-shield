import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { authService } from '../services/authService.js';
import { tokenStore } from '../lib/apiClient.js';
import { currentUserAtom } from '../store/authAtom.js';

export const useCurrentUser = () => {
  const [, setUser] = useAtom(currentUserAtom);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await authService.me();
      setUser(user);
      return user;
    },
    enabled: Boolean(tokenStore.get()),
    retry: false,
  });
}

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.login,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export const useSignup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authService.signup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export const useLogout = () => {
  const qc = useQueryClient();
  const [, setUser] = useAtom(currentUserAtom);
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setUser(null);
      qc.clear();
    },
  });
}

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const [, setUser] = useAtom(currentUserAtom);
  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(['me'], user);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export const useChangePassword = () => {
  return useMutation({ mutationFn: authService.changePassword });
}
