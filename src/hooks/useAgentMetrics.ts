import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

interface AgentMetrics {
  avgResponseTime: string;
  resolvedTickets: number;
  openTickets: number;
}

interface SupabaseTicketMessage {
  created_at: string;
  is_internal: boolean;
}

interface SupabaseTicket {
  status: string;
  created_at: string;
  ticket_messages?: SupabaseTicketMessage[];
}

interface SupabaseAssignment {
  ticket_id: string;
  assigned_at?: string;
  tickets: SupabaseTicket;
}

export const useAgentMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      try {
        // First get the employee ID
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();

        if (employeeError) throw employeeError;

        // Get current assignments
        const { data: currentAssignments, error: currentError } = await supabase
          .from('employee_ticket_assignments')
          .select(`
            ticket_id,
            tickets!inner (
              status,
              created_at
            )
          `)
          .eq('employee_id', employeeData.id)
          .is('unassigned_at', null);

        if (currentError) throw currentError;

        // Get assignments from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentAssignments, error: recentError } = await supabase
          .from('employee_ticket_assignments')
          .select(`
            ticket_id,
            assigned_at,
            tickets!inner (
              status,
              created_at,
              ticket_messages (
                created_at,
                is_internal
              )
            )
          `)
          .eq('employee_id', employeeData.id)
          .gte('assigned_at', thirtyDaysAgo.toISOString());

        if (recentError) throw recentError;

        // Calculate metrics
        const openTickets = ((currentAssignments as unknown) as SupabaseAssignment[]).filter(
          assignment => assignment.tickets.status === 'open'
        ).length;

        const resolvedTickets = ((recentAssignments as unknown) as SupabaseAssignment[]).filter(
          assignment => assignment.tickets.status === 'resolved'
        ).length;

        // Calculate average response time
        let totalResponseTime = 0;
        let responseCount = 0;

        ((recentAssignments as unknown) as SupabaseAssignment[]).forEach(assignment => {
          if (!assignment.tickets.ticket_messages) return;

          const firstResponse = assignment.tickets.ticket_messages
            .filter(msg => !msg.is_internal)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

          if (firstResponse && assignment.assigned_at) {
            const assignedTime = new Date(assignment.assigned_at).getTime();
            const responseTime = new Date(firstResponse.created_at).getTime();
            totalResponseTime += Math.abs(responseTime - assignedTime);
            responseCount++;
          }
        });

        const avgResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : 0;
        const avgResponseTimeMinutes = Math.round(avgResponseTimeMs / (1000 * 60));

        // Format the time
        const hours = Math.floor(avgResponseTimeMinutes / 60);
        const minutes = avgResponseTimeMinutes % 60;
        const avgResponseTime = hours > 0 
          ? `${hours}h ${minutes}m`
          : `${minutes}m`;

        setMetrics({
          avgResponseTime,
          resolvedTickets,
          openTickets
        });

      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Subscribe to changes
    const subscription = supabase
      .channel('agent_metrics_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_ticket_assignments'
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { metrics, loading, error };
}; 