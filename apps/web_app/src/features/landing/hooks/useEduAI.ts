import { useState, useEffect, useCallback } from 'react';
import { EduAIMessage } from '../types/landing.types';
import { eduAIService } from '../services/eduAI.service';

export const useEduAI = () => {
  const [messages, setMessages] = useState<EduAIMessage[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>(`session-${Date.now()}`);

  useEffect(() => {
    const initEduAI = async () => {
      try {
        const { greeting, suggestedPrompts: prompts } = await eduAIService.getInitialState();
        setMessages([
          {
            id: 'init-msg',
            sender: 'assistant',
            content: greeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setSuggestedPrompts(prompts);
      } catch (err) {
        console.error('Failed to initialize EduAI state:', err);
      }
    };

    initEduAI();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: EduAIMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const res = await eduAIService.sendMessage({
          message: text.trim(),
          sessionId,
        });

        if (res.sessionId) {
          setSessionId(res.sessionId);
        }

        const aiMsg: EduAIMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        if (res.suggestedPrompts) {
          setSuggestedPrompts(res.suggestedPrompts);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'system',
            content: 'Sorry, I encountered an issue connecting to EduAI. Please try again or submit a quick enquiry.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId]
  );

  return {
    messages,
    suggestedPrompts,
    isTyping,
    sendMessage,
  };
};

export default useEduAI;
