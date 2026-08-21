import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useCreateChatbotSessionMutation,
  useSendChatbotMessageMutation,
  useLazyGetChatbotSessionQuery,
} from '@/shared/api/chatbot.api';
import { ChatMessage } from '../types/chatbot.types';

const SESSION_STORAGE_KEY = 'edutrack_chatbot_session_id';

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  sender: 'bot',
  text: 'Hello! I am your **EduTrack Admissions Concierge**. How may I assist you with admissions, curriculum, fee schedules, or campus tours today?',
  timestamp: new Date().toISOString(),
  suggestedFollowUps: [
    'What is the admission procedure?',
    'What are the school fees?',
    'How can I schedule a campus visit?',
    'Which academic boards are offered?',
  ],
};

export function useChatbot() {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const [createSessionTrigger] = useCreateChatbotSessionMutation();
  const [sendMessageTrigger] = useSendChatbotMessageMutation();
  const [getSessionTrigger] = useLazyGetChatbotSessionQuery();

  const isInitializingRef = useRef(false);

  // Initialize or hydrate session
  const initializeSession = useCallback(async (): Promise<string | null> => {
    if (isInitializingRef.current) return sessionId;
    isInitializingRef.current = true;

    try {
      // 1. If we already have a session ID, try to verify/hydrate it
      const existingId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (existingId) {
        try {
          const res = await getSessionTrigger(existingId).unwrap();
          if (res.success && res.data?.session?.sessionId) {
            setSessionId(existingId);

            // Hydrate historical messages if available
            if (res.data.messages && res.data.messages.length > 0) {
              const mapped: ChatMessage[] = res.data.messages.map((m) => ({
                id: m.messageId,
                sender: m.sender,
                text: m.messageText,
                timestamp: m.createdAt,
                status: 'sent',
                suggestedFollowUps: m.metadata?.suggestedFollowUps || [],
                intent: m.metadata?.intent,
                leadCaptured: m.metadata?.leadCaptured,
                escalationRequired: m.metadata?.escalationRequired,
              }));
              setMessages(mapped);
            }
            isInitializingRef.current = false;
            return existingId;
          }
        } catch {
          // Session expired or invalid on backend; proceed to create new
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

      // 2. Create a fresh session
      const createRes = await createSessionTrigger({ channel: 'web_widget' }).unwrap();
      if (createRes.success && createRes.data?.sessionId) {
        const newId = createRes.data.sessionId;
        sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
        setSessionId(newId);
        setMessages([INITIAL_WELCOME_MESSAGE]);
        isInitializingRef.current = false;
        return newId;
      }
    } catch (err: any) {
      console.warn('[Chatbot Session Initialization Error]:', err);
      setError('Unable to initialize chat concierge. Please check your connection.');
    } finally {
      isInitializingRef.current = false;
    }

    return null;
  }, [createSessionTrigger, getSessionTrigger, sessionId]);

  // Send a new message turn
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setLastFailedMessage(null);

      // Temporary local optimistic message ID
      const userMsgId = `user-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      // Append user turn
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Ensure valid session exists
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          activeSessionId = await initializeSession();
        }

        if (!activeSessionId) {
          throw new Error('Could not establish chat connection with school admissions.');
        }

        // Call backend message turn API
        const response = await sendMessageTrigger({
          session_id: activeSessionId,
          message: trimmed,
        }).unwrap();

        if (response.success && response.data) {
          const {
            botMessageId,
            answer,
            intent,
            confidence,
            suggestedFollowUps,
            leadCaptured,
            escalationRequired,
          } = response.data;

          // Update user message status to sent
          setMessages((prev) =>
            prev.map((msg) => (msg.id === userMsgId ? { ...msg, status: 'sent' } : msg)),
          );

          // Append bot answer
          const botMessage: ChatMessage = {
            id: botMessageId || `bot-${Date.now()}`,
            sender: 'bot',
            text: answer,
            timestamp: new Date().toISOString(),
            status: 'sent',
            intent,
            confidence,
            suggestedFollowUps: suggestedFollowUps || [],
            leadCaptured,
            escalationRequired,
          };

          setMessages((prev) => [...prev, botMessage]);
        } else {
          throw new Error(response.message || 'Error processing response');
        }
      } catch (err: any) {
        console.error('[Chatbot Send Message Error]:', err);
        setLastFailedMessage(trimmed);
        setError('Message could not be delivered. Please retry.');

        // Mark optimistic message as failed
        setMessages((prev) =>
          prev.map((msg) => (msg.id === userMsgId ? { ...msg, status: 'error' } : msg)),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, initializeSession, sendMessageTrigger],
  );

  // Retry sending last failed message
  const retryLastMessage = useCallback(
    (textToRetry?: string) => {
      const msg = textToRetry || lastFailedMessage;
      if (msg) {
        // Remove the error message bubble before retrying
        setMessages((prev) => prev.filter((m) => !(m.status === 'error' && m.text === msg)));
        sendMessage(msg);
      }
    },
    [lastFailedMessage, sendMessage],
  );

  // Reset conversation and start fresh
  const startNewConversation = useCallback(async () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId(null);
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setError(null);
    setLastFailedMessage(null);
    try {
      const res = await createSessionTrigger({ channel: 'web_widget' }).unwrap();
      if (res.success && res.data?.sessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, res.data.sessionId);
        setSessionId(res.data.sessionId);
      }
    } catch (err) {
      console.warn('[Chatbot New Session Error]:', err);
    }
  }, [createSessionTrigger]);

  // Initial check on mount
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId, initializeSession]);

  return {
    sessionId,
    messages,
    isLoading,
    error,
    lastFailedMessage,
    sendMessage,
    retryLastMessage,
    startNewConversation,
    initializeSession,
  };
}

export default useChatbot;
