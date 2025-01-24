import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const useTeamEmployees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchTeamEmployees = async () => {
      try {
        // First get the current employee's ID
        const { data: currentEmployee, error: employeeError } = await supabase
          .from('employees')
          .select('id')
          .eq('email', user.email)
          .single();

        if (employeeError) throw employeeError;

        // Get the teams this employee belongs to
        const { data: teamData, error: teamError } = await supabase
          .from('employee_teams')
          .select('team_id')
          .eq('employee_id', currentEmployee.id);

        if (teamError) throw teamError;

        const teamIds = teamData.map(t => t.team_id);

        // Get employee IDs from the same teams
        const { data: teamMemberData, error: memberError } = await supabase
          .from('employee_teams')
          .select('employee_id')
          .in('team_id', teamIds);

        if (memberError) throw memberError;

        const teamMemberIds = teamMemberData.map(m => m.employee_id);

        // Get all employees in the same teams
        const { data: teamEmployees, error: employeesError } = await supabase
          .from('employees')
          .select(`
            id,
            name,
            email,
            role
          `)
          .neq('id', currentEmployee.id) // Exclude current employee
          .in('id', teamMemberIds);

        if (employeesError) throw employeesError;

        setEmployees(teamEmployees || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching team employees:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch team employees');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamEmployees();
  }, [user]);

  return { employees, loading, error };
}; 