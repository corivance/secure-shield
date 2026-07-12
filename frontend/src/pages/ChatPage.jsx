import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { ChatThread } from '../components/chat/ChatThread.jsx';
import { ChatComposer } from '../components/chat/ChatComposer.jsx';
import { useChatHistory, useAskChat } from '../hooks/useChat.js';

const ChatPage = () => {
  const { t } = useTranslation();
  const { data: messages = [] } = useChatHistory();
  const ask = useAskChat();

  const ordered = [...messages].reverse();

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <PageHeader title={t('nav.chat')} subtitle={t('chat.subtitle')} />
      <div className="flex-1 overflow-y-auto pr-1 mb-4">
        <ChatThread messages={ordered} pending={ask.isPending} />
      </div>
      <ErrorBanner error={ask.error} />
      <ChatComposer onSend={(payload) => ask.mutate(payload)} sending={ask.isPending} />
    </div>
  );
};

export default ChatPage;
