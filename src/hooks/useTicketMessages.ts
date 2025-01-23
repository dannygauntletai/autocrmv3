import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'employee' | 'customer' | 'system';
  message_body: string;
  is_internal: boolean;
  created_at: string;
  sender_name?: string;
}

export const useTicketMessages = (ticketId: string) => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // First get the messages (excluding internal messages)
        const { data: messageData, error: messagesError } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .eq('is_internal', false)  // Only get non-internal messages
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // For each employee sender, get their name
        const employeeIds = messageData
          ?.filter(msg => msg.sender_type === 'employee')
          .map(msg => msg.sender_id) || [];

        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, name, email')
          .in('id', employeeIds);

        if (employeeError) throw employeeError;

        // Create a map of employee IDs to names
        const employeeMap = new Map(
          employeeData?.map(emp => [emp.id, emp.name || emp.email]) || []
        );

        // Format messages with sender names
        const formattedMessages = messageData?.map(msg => ({
          ...msg,
          sender_name: msg.sender_type === 'employee' 
            ? employeeMap.get(msg.sender_id) || msg.sender_id
            : msg.sender_type === 'system' 
              ? 'System'
              : 'Customer'
        })) || [];

        setMessages(formattedMessages);
        setError(null);
      } catch (err) {
        console.error('Error fetching ticket messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ticket messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time changes for this ticket
    const subscription = supabase
      .channel(`ticket_messages_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload: RealtimePostgresChangesPayload<TicketMessage>) => {
          // Only fetch if the change involves a non-internal message
          const newMessage = payload.new as TicketMessage;
          if (newMessage && newMessage.is_internal === false) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  return { messages, loading, error };
}; 