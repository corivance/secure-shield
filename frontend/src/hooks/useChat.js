import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chatService.js';

export const useChatHistory = () => {
  return useQuery({ queryKey: ['chat-history'], queryFn: chatService.history });
}

export const useAskChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chatService.ask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat-history'] }),
  });
}
