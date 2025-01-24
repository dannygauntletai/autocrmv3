import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface InternalNote {
  id: string;
  ticket_id: string;
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
        console.log('Fetching internal notes for ticket:', ticketId);
        // First get the internal messages
        const { data: messageData, error: messagesError } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .eq('is_internal', true)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        console.log('Fetched messages:', messageData);

        // For each employee sender, get their name
        const employeeIds = messageData
          ?.filter(msg => msg.sender_type === 'employee')
          .map(msg => msg.sender_id) || [];

        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id, name, email')
          .in('id', employeeIds);

        if (employeeError) throw employeeError;
        console.log('Fetched employee data:', employeeData);

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

        console.log('Setting formatted notes:', formattedNotes);
        setNotes(formattedNotes);
        setError(null);
      } catch (err) {
        console.error('Error fetching internal notes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch internal notes');
      } finally {
        setLoading(false);
      }
    };

    const getEmployeeName = async (employeeId: string): Promise<string> => {
      try {
        const { data: employee, error } = await supabase
          .from('employees')
          .select('name, email')
          .eq('id', employeeId)
          .single();

        if (error) throw error;
        return employee.name || employee.email;
      } catch (err) {
        console.error('Error fetching employee name:', err);
        return employeeId;
      }
    };

    fetchNotes();

    // Set up subscription for all ticket messages
    const channel = supabase.channel('internal_notes_changes');
    
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages'
        },
        async (payload) => {
          const newMessage = payload.new as InternalNote;
          console.log('Received new message:', newMessage);
          
          // Only process if it's an internal message for this ticket
          if (newMessage.ticket_id === ticketId && newMessage.is_internal) {
            console.log('Processing new internal note');
            
            // Get employee name if needed
            if (newMessage.sender_type === 'employee') {
              const employeeName = await getEmployeeName(newMessage.sender_id);
              newMessage.sender_name = employeeName;
            } else {
              newMessage.sender_name = newMessage.sender_type === 'system' ? 'System' : 'Customer';
            }
            
            // Update notes state
            setNotes(currentNotes => [...currentNotes, newMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ticket_messages'
        },
        (payload) => {
          const updatedMessage = payload.new as InternalNote;
          
          // Only process if it's an internal message for this ticket
          if (updatedMessage.ticket_id === ticketId && updatedMessage.is_internal) {
            setNotes(currentNotes => 
              currentNotes.map(note => 
                note.id === updatedMessage.id ? { ...note, ...updatedMessage } : note
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ticket_messages'
        },
        (payload) => {
          const deletedMessage = payload.old as InternalNote;
          
          // Only process if it's an internal message for this ticket
          if (deletedMessage.ticket_id === ticketId && deletedMessage.is_internal) {
            setNotes(currentNotes => 
              currentNotes.filter(note => note.id !== deletedMessage.id)
            );
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