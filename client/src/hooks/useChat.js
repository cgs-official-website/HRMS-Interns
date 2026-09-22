import { useState, useCallback, useRef } from 'react';
import { sendMessage } from '../utils/gemini';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'model',
  content: `Hi! I'm **Zuna AI**, your CGS assistant!

I can help with:
- Our services (IT & BPO)
- Careers & internships
- Internal tools & tech
- Contact info

What would you like to know?`,
  timestamp: new Date(),
};

export function useChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const historyRef = useRef([]);

  const sendUserMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await sendMessage(historyRef.current, userText);

      const botMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: responseText,
        timestamp: new Date(),
      };

      // Append to history for context continuity
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: userText },
        { role: 'model', content: responseText },
      ];

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Zuna AI error:', err);

      let errorMessage = 'Something went wrong. Please try again.';
      if (err.message?.includes('VITE_GROQ_API_KEY')) {
        errorMessage = 'API key missing. Add VITE_GROQ_API_KEY to your .env file.';
      } else if (err.message?.includes('model_decommissioned') || err.error?.code === 'model_decommissioned') {
        errorMessage = 'The AI model specified is decommissioned. Please update the model ID in the code.';
      } else if (err.status === 401 || err.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid API key. Please check your VITE_GROQ_API_KEY in .env';
      } else if (err.status === 429 || err.message?.includes('quota')) {
        errorMessage = 'Rate limit reached. Please wait a moment and try again.';
      } else if (err.status === 400) {
        errorMessage = `Bad Request: ${err.error?.message || err.message}`;
      }
      setError(errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'error',
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
    historyRef.current = [];
  }, []);

  return { messages, isLoading, error, sendUserMessage, clearChat };
}
