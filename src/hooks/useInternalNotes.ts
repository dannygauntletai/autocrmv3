import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

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

export const useInternalNotes = (ticketId: string) => {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        
        const { data: messageData, error: messagesError } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .eq('is_internal', true)
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
        setError('Failed to load internal notes');
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

    channel
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages'
        },
        async (payload) => {
          const newMessage = payload.new as InternalNote;
          
          // Only process if it's an internal message for this ticket
          if (newMessage.is_internal && newMessage.ticket_id === ticketId) {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  return { notes, loading, error };
};