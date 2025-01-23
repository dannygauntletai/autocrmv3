import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import type { ApiKey } from "./types/common";

interface Props {
  onFilterChange: (filters: {
    endpoint?: string;
    apiKeyId?: string;
    status?: string;
    date?: string;
  }) => void;
}

export const ApiUsageFilters = ({ onFilterChange }: Props) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [filters, setFilters] = useState({
    endpoint: "",
    apiKeyId: "",
    status: "",
    date: "",
  });

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setApiKeys(data || []);
      } catch (error) {
        console.error('Error fetching API keys:', error);
      }
    };

    fetchApiKeys();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mb-6 flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={filters.endpoint}
          onChange={(e) => handleFilterChange('endpoint', e.target.value)}
          placeholder="Search endpoints..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <select
        value={filters.apiKeyId}
        onChange={(e) => handleFilterChange('apiKeyId', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All API Keys</option>
        {apiKeys.map(key => (
          <option key={key.id} value={key.id}>
            {key.description}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => handleFilterChange('status', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All Status</option>
        <option value="success">Success (2xx)</option>
        <option value="error">Error (4xx)</option>
        <option value="server_error">Server Error (5xx)</option>
      </select>
      <input
        type="date"
        value={filters.date}
        onChange={(e) => handleFilterChange('date', e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md"
      />
    </div>
  );
};