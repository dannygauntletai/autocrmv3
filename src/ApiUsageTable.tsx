import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { ApiLog } from "./types/common";

interface Props {
  filters: {
    endpoint?: string;
    apiKeyId?: string;
    status?: string;
    date?: string;
  };
}

export const ApiUsageTable = ({ filters }: Props) => {
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApiLogs = async () => {
      try {
        let query = supabase
          .from('api_logs')
          .select(`
            *,
            api_keys (
              description
            )
          `)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.endpoint) {
          query = query.ilike('endpoint_accessed', `%${filters.endpoint}%`);
        }

        if (filters.apiKeyId) {
          query = query.eq('api_key_id', filters.apiKeyId);
        }

        if (filters.status) {
          switch (filters.status) {
            case 'success':
              query = query.lt('response_code', 300);
              break;
            case 'error':
              query = query.gte('response_code', 400).lt('response_code', 500);
              break;
            case 'server_error':
              query = query.gte('response_code', 500);
              break;
          }
        }

        if (filters.date) {
          const startDate = new Date(filters.date);
          const endDate = new Date(filters.date);
          endDate.setDate(endDate.getDate() + 1);
          
          query = query
            .gte('created_at', startDate.toISOString())
            .lt('created_at', endDate.toISOString());
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;
        setApiLogs(data || []);
      } catch (error) {
        console.error('Error fetching API logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiLogs();
  }, [filters]);

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (apiLogs.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No API logs found.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md">
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="font-medium text-gray-700">Timestamp</div>
        <div className="font-medium text-gray-700">API Key</div>
        <div className="col-span-2 font-medium text-gray-700">Endpoint</div>
        <div className="font-medium text-gray-700">Status</div>
        <div className="font-medium text-gray-700">Details</div>
      </div>
      {apiLogs.map(log => (
        <div key={log.id} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200">
          <div className="text-sm text-gray-600">
            {new Date(log.created_at).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            {log.api_keys?.description || 'Unknown'}
          </div>
          <div className="col-span-2 font-mono text-sm text-gray-900">
            {log.endpoint_accessed}
          </div>
          <div className="flex items-center gap-1">
            {log.response_code < 400 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-gray-900">{log.response_code}</span>
          </div>
          <div className="text-sm text-gray-600">
            {log.request_payload ? (
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(log.request_payload, null, 2)}
              </pre>
            ) : (
              'No details'
            )}
          </div>
        </div>
      ))}
    </div>
  );
};