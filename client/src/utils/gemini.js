import Groq from 'groq-sdk';
import { CGS_SYSTEM_PROMPT } from '../data/knowledgeBase';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Send a message using the Groq API (Meta LLaMA 3).
 * @param {Array<{role: string, content: string}>} history - Previous messages
 * @param {string} userMessage - The latest user message
 * @returns {Promise<string>} - The assistant's response text
 */
export async function sendMessage(history, userMessage) {
  if (!API_KEY) {
    throw new Error('VITE_GROQ_API_KEY is not set in your .env file');
  }

  // Initialize Groq client with browser usage allowed
  const groq = new Groq({ 
    apiKey: API_KEY, 
    dangerouslyAllowBrowser: true 
  });

  // Map history to Groq format (role: 'user' | 'assistant' | 'system')
  const messages = [
    { role: 'system', content: CGS_SYSTEM_PROMPT },
    ...history.map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.7,
    max_tokens: 512,
  });

  return response.choices[0]?.message?.content || '';
}
