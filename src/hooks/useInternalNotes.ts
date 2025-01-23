import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface InternalNote {
  id: string;
  message_body: string;
  sender_id: string;
  sender_type: 'employee' | 'customer' | 'system';
  created_at: string;
  sender_name?: string;
  is_internal: boolean;
}

// Type guard to check if an object is an InternalNote
const isInternalNote = (obj: any): obj is InternalNote => {
  return obj && typeof obj.is_internal === 'boolean';
};

export const useInternalNotes = (ticketId: string) => {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // First get the internal messages
        const { data: messageData, error: messagesError } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .eq('is_internal', true)
          .order('created_at', { ascending: false });

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
        const formattedNotes = messageData?.map(msg => ({
          ...msg,
          sender_name: msg.sender_type === 'employee' 
            ? employeeMap.get(msg.sender_id) || msg.sender_id
            : msg.sender_type === 'system' 
              ? 'System'
              : 'Customer'
        })) || [];

        setNotes(formattedNotes);
        setError(null);
      } catch (err) {
        console.error('Error fetching internal notes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch internal notes');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();

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
        (payload: RealtimePostgresChangesPayload<InternalNote>) => {
          // Only fetch if the change involves an internal message
          if (payload.new && isInternalNote(payload.new) && payload.new.is_internal === true) {
            fetchNotes();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  return { notes, loading, error };
}; 