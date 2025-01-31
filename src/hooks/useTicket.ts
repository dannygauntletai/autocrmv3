import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Ticket, TicketStatus, TicketPriority } from '../types/common';

export const useTicket = (ticketId: string) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchTicket = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (fetchError) throw fetchError;
        if (isSubscribed) {
          setTicket(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
        if (isSubscribed) {
          setError(err instanceof Error ? err.message : 'Failed to fetch ticket');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchTicket();

    // Create a unique channel name for this ticket subscription
    const channelName = `ticket-${ticketId}-${Math.random()}`;
    console.log('Creating new channel:', channelName);

    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId}`,
        },
        (payload) => {
          console.log('Received ticket update:', payload);
          if (isSubscribed) {
            if (payload.eventType === 'DELETE') {
              setTicket(null);
            } else {
              setTicket(payload.new as Ticket);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });

    return () => {
      console.log('Cleaning up subscription for channel:', channelName);
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const updateTicketStatus = async (status: TicketStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating ticket status:', err);
      throw err;
    }
  };

  const updateTicketPriority = async (priority: TicketPriority) => {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          priority, 
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;
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