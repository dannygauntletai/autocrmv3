import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import { TicketListItemType } from '../types/common';

export const useAssignedTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketListItemType[]>([]);
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
            employee_ticket_assignments!inner(employee_id)
          `)
          .eq('employee_ticket_assignments.employee_id', employeeData.id)
          .is('employee_ticket_assignments.unassigned_at', null)
          .order('updated_at', { ascending: false });

        if (assignmentError) throw assignmentError;

        // Format the tickets
        const formattedTickets = (assignedTickets || []).map(ticket => ({
          id: ticket.id,
          subject: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          customer: ticket.email,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at
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

    // Subscribe to changes in ticket assignments and ticket updates
    const assignmentSubscription = supabase
      .channel('assigned_tickets_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_ticket_assignments'
        },
        () => {
          fetchAssignedTickets();
        }
      )
      .subscribe();

    const ticketSubscription = supabase
      .channel('assigned_tickets_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          fetchAssignedTickets();
        }
      )
      .subscribe();

    return () => {
      assignmentSubscription.unsubscribe();
      ticketSubscription.unsubscribe();
    };
  }, [user]);

  return { tickets, loading, error };
}; 