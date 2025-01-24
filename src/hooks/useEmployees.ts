import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee } from '../types/common';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('employees')
          .select('id, name')
          .order('name');

        if (fetchError) throw fetchError;
        setEmployees(data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return { employees, loading, error };
}; 