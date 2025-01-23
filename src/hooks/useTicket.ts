import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export const useTicket = (ticketId: string) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const { data, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketError) throw ticketError;

        setTicket(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('ticket_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`
        },
        () => {
          fetchTicket();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  return { ticket, loading, error };
}; 