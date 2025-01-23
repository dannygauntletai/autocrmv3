import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogList } from './AuditLogList';
import type { AuditLog } from './types/common';

type ActionType = 'SCHEMA_UPDATE' | 'TICKET_CREATE' | 'TICKET_UPDATE';

export const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    actionType: '' as ActionType | ''
  });

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.actionType) {
        query = query.eq('action_type', filters.actionType);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
      }

      if (filters.search) {
        query = query.or(`
          performed_by.ilike.%${filters.search}%,
          action_type.ilike.%${filters.search}%,
          action_details->>'field_name'.ilike.%${filters.search}%
        `);
      }

      const { data, error: fetchError } = await query.limit(50);

      if (fetchError) throw fetchError;
      setAuditLogs(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Audit Logs</h2>
      </div>
      
      <AuditLogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error: {error}
        </div>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <AuditLogList logs={auditLogs} />
        </div>
      )}
    </div>
  );
};