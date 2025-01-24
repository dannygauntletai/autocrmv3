import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

export interface Activity {
  id: string;
  type: 'reply' | 'resolved';
  ticket: string;
  time: string;
  description: string;
}

export const useRecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      try {
        // First get the employee ID
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();

        if (employeeError) throw employeeError;

        // Get recent assignments and their associated tickets and messages
        const { data: recentData, error: recentError } = await supabase
          .from('employee_ticket_assignments')
          .select(`
            id,
            assigned_at,
            tickets!inner (
              title,
              status,
              ticket_messages (
                id,
                created_at,
                is_internal
              )
            )
          `)
          .eq('employee_id', employeeData.id)
          .order('assigned_at', { ascending: false })
          .limit(10);

        if (recentError) throw recentError;

        const formattedActivities = ((recentData as unknown) as any[]).map(assignment => {
          const isResolved = assignment.tickets.status === 'resolved';
          
          // Format the time
          const timeAgo = getTimeAgo(new Date(assignment.assigned_at));

          return {
            id: assignment.id,
            type: isResolved ? 'resolved' : 'reply',
            ticket: assignment.tickets.title,
            time: timeAgo,
            description: isResolved 
              ? 'Marked ticket as resolved'
              : 'Assigned to ticket'
          } as Activity;
        });

        setActivities(formattedActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to changes
    const subscription = supabase
      .channel('recent_activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_ticket_assignments'
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { activities, loading, error };
};

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
} 