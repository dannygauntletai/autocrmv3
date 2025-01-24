import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Ticket, TicketStatus, TicketPriority } from '../types/common';

export const useTicket = (ticketId: string) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (fetchError) throw fetchError;
        setTicket(data);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();

    // Subscribe to changes
    const subscription = supabase
      .channel(`ticket_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`
        },
        (payload) => {
          if (payload.new) {
            setTicket(payload.new as Ticket);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  const updateTicketStatus = async (status: TicketStatus) => {
    try {
      const { data, error: updateError } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Update local state immediately
      if (data) {
        setTicket(data);
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      throw err;
    }
  };

  const updateTicketPriority = async (priority: TicketPriority) => {
    try {
      const { data, error: updateError } = await supabase
        .from('tickets')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Update local state immediately
      if (data) {
        setTicket(data);
      }
    } catch (err) {
      console.error('Error updating ticket priority:', err);
      throw err;
    }
  };

  return { 
    ticket, 
    loading, 
    error,
    updateTicketStatus,
    updateTicketPriority
  };
}; 