import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './useAuth';

type EmployeeRole = 'agent' | 'admin' | 'supervisor' | null;

export const useEmployeeRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<EmployeeRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user?.email) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .select('role')
          .eq('email', user.email)
          .single();

        if (employeeError) throw employeeError;
        setRole(employee?.role as EmployeeRole);
        setError(null);
      } catch (err) {
        console.error('Error fetching employee role:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employee role');
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user?.email]);

  return { role, loading, error };
}; 