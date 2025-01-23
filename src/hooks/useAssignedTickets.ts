import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface AssignedTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  customer: string;
  tags: string[];
  lastUpdate: string;
}

interface TicketAssignment {
  tickets: {
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
  };
}

export const useAssignedTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<AssignedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAssignedTickets = async () => {
      try {
        // First get the employee ID
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();

        if (employeeError) throw employeeError;

        // Get all active assignments for this employee
        const { data: assignedTickets, error: assignmentError } = await supabase
          .from('tickets')
          .select(`
            id,
            title,
            status,
            priority,
            created_at,
            updated_at,
            email,
            tags,
            ticket_assignments!inner(employee_id)
          `)
          .eq('ticket_assignments.employee_id', employeeData.id)
          .is('ticket_assignments.unassigned_at', null)
          .order('updated_at', { ascending: false });

        if (assignmentError) throw assignmentError;

        // Format the tickets
        const formattedTickets = (assignedTickets || []).map(ticket => ({
          id: ticket.id,
          subject: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at,
          customer: ticket.email,
          tags: ticket.tags || [],
          lastUpdate: new Date(ticket.updated_at).toLocaleString()
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

    // Subscribe to changes in ticket assignments
    const subscription = supabase
      .channel('assigned_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_assignments'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          fetchAssignedTickets();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { tickets, loading, error };
}; 