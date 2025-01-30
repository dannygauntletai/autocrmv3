import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AgentResponse {
  success: boolean;
  data: {
    output: string;
    toolCalls?: {
      name: string;
      arguments: Record<string, any>;
    }[];
  };
  error?: string;
}

export function useAgentInteraction(ticketId: string) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize Supabase client
  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to chat
      const userMessage: AgentMessage = {
        role: 'user',
        content,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage]);

      // Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke<AgentResponse>(
        'ai-employee',
        {
          body: {
            input: content,
            ticketId,
            config: {
              temperature: 0.7,
              maxTokens: 1000
            }
          }
        }
      );

      if (functionError) throw new Error(functionError.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to get response');

      // Add assistant message to chat
      const assistantMessage: AgentMessage = {
        role: 'assistant',
        content: data.data.output,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
} 
