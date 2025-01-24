import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';
import { TicketListItemType } from '../types/common';

export const useTeamTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketListItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchTeamTickets = async () => {
      try {
        // First get the employee's teams
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();

        if (employeeError) throw employeeError;

        const { data: teamData, error: teamError } = await supabase
          .from('employee_teams')
          .select('team_id')
          .eq('employee_id', employeeData.id);

        if (teamError) throw teamError;

        const teamIds = teamData.map(t => t.team_id);

        // Get all active team assignments
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
            team_ticket_assignments!inner(team_id)
          `)
          .in('team_ticket_assignments.team_id', teamIds)
          .is('team_ticket_assignments.unassigned_at', null)
          .order('updated_at', { ascending: false });

        if (assignmentError) throw assignmentError;

        // Format the tickets
        const formattedTickets = (assignedTickets || []).map(ticket => ({
          id: ticket.id,
          subject: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          customer: ticket.email,
          lastUpdate: new Date(ticket.updated_at).toLocaleString(),
          tags: ticket.tags || []
        }));

        setTickets(formattedTickets);
        setError(null);
      } catch (err) {
        console.error('Error fetching team tickets:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch team tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamTickets();

    // Subscribe to changes in team ticket assignments
    const subscription = supabase
      .channel('team_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_ticket_assignments'
        },
        () => {
          fetchTeamTickets();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { tickets, loading, error };
}; 