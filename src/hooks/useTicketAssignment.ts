import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useTicketAssignment = (ticketId: string) => {
  const [assignments, setAssignments] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data, error: assignmentError } = await supabase
          .from('employee_ticket_assignments')
          .select('employee_id, unassigned_at')
          .eq('ticket_id', ticketId);

        if (assignmentError) throw assignmentError;

        // Create a map of employee IDs to their assignment status
        const assignmentMap = (data || []).reduce((acc, assignment) => {
          acc[assignment.employee_id] = assignment.unassigned_at === null;
          return acc;
        }, {} as Record<string, boolean>);

        setAssignments(assignmentMap);
        setError(null);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();

    // Subscribe to changes in assignments
    const subscription = supabase
      .channel(`ticket_assignments_${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_ticket_assignments',
          filter: `ticket_id=eq.${ticketId}`
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  return { assignments, loading, error };
}; 