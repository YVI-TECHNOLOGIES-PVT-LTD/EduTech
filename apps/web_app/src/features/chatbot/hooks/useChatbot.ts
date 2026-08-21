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

  const sessionIdRef = useRef<string | null>(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

  const [createSessionTrigger] = useCreateChatbotSessionMutation();
  const [sendMessageTrigger] = useSendChatbotMessageMutation();
  const [getSessionTrigger] = useLazyGetChatbotSessionQuery();

  const isInitializingRef = useRef(false);

  // Initialize or hydrate session
  const initializeSession = useCallback(
    async (forceNew = false): Promise<string | null> => {
      if (isInitializingRef.current && !forceNew) return sessionIdRef.current;
      isInitializingRef.current = true;

      try {
        // 1. If we have an existing session and not forcing new, try to verify/hydrate it
        const existingId = !forceNew
          ? sessionIdRef.current || sessionStorage.getItem(SESSION_STORAGE_KEY)
          : null;
        if (existingId) {
          try {
            const res = await getSessionTrigger(existingId).unwrap();
            if (res.success && res.data?.session?.sessionId) {
              setSessionId(existingId);
              sessionIdRef.current = existingId;

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
            // Session expired, mismatched tenant (403), or invalid on backend; clear & recreate
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            setSessionId(null);
            sessionIdRef.current = null;
          }
        }

        // 2. Create a fresh session
        const createRes = await createSessionTrigger({ channel: 'web_widget' }).unwrap();
        if (createRes.success && createRes.data?.sessionId) {
          const newId = createRes.data.sessionId;
          sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
          setSessionId(newId);
          sessionIdRef.current = newId;
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
    },
    [createSessionTrigger, getSessionTrigger],
  );

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
        let activeSessionId = sessionIdRef.current;
        if (!activeSessionId) {
          activeSessionId = await initializeSession();
        }

        if (!activeSessionId) {
          throw new Error('Could not establish chat connection with school admissions.');
        }

        // Helper to invoke send message
        let response: any = null;
        try {
          response = await sendMessageTrigger({
            session_id: activeSessionId,
            message: trimmed,
          }).unwrap();
        } catch (sendErr: any) {
          // If tenant mismatch (403), session expired (404), or unauthorized, heal session and retry once
          const isSessionMismatch =
            sendErr?.status === 403 ||
            sendErr?.status === 404 ||
            sendErr?.status === 401 ||
            sendErr?.data?.error === 'TENANT_MISMATCH' ||
            sendErr?.data?.error === 'SESSION_NOT_FOUND';

          if (isSessionMismatch) {
            console.warn(
              '[Chatbot] Session invalid or tenant mismatch detected. Auto-recovering session...',
            );
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            const freshSessionId = await initializeSession(true);
            if (freshSessionId) {
              response = await sendMessageTrigger({
                session_id: freshSessionId,
                message: trimmed,
              }).unwrap();
            } else {
              throw sendErr;
            }
          } else {
            throw sendErr;
          }
        }

        if (response?.success && response.data) {
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
          throw new Error(response?.message || 'Error processing response');
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
    [isLoading, initializeSession, sendMessageTrigger],
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
    sessionIdRef.current = null;
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setError(null);
    setLastFailedMessage(null);
    await initializeSession(true);
  }, [initializeSession]);

  // Initial check on mount only
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

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
