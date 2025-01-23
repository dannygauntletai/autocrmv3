import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import type { TicketListItemType } from '../types/common';

export const useAssignedTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketListItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedTickets = async () => {
      try {
        if (!user) return;

        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();

        if (employeeError) throw employeeError;

        // First get the assigned ticket IDs
        const { data: assignments, error: assignmentsError } = await supabase
          .from('ticket_assignments')
          .select('ticket_id')
          .eq('employee_id', employeeData.id)
          .is('unassigned_at', null);

        if (assignmentsError) throw assignmentsError;

        const ticketIds = assignments.map(a => a.ticket_id);

        if (ticketIds.length === 0) {
          setTickets([]);
          return;
        }

        // Then fetch the actual tickets
        const { data: assignedTickets, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            id,
            title,
            status,
            priority,
            email,
            updated_at,
            tags
          `)
          .in('id', ticketIds);

        if (ticketsError) throw ticketsError;

        const formattedTickets: TicketListItemType[] = (assignedTickets || []).map(ticket => ({
          id: ticket.id,
          subject: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          customer: ticket.email,
          lastUpdate: ticket.updated_at,
          tags: ticket.tags || []
        }));

        setTickets(formattedTickets);
        setError(null);
      } catch (err) {
        console.error('Error fetching assigned tickets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assigned tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedTickets();
  }, [user]);

  return { tickets, loading, error };
}; 