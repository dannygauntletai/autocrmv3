import { useEffect, useState } from "react";
import { ApiKeyItem } from "./ApiKeyItem";
import { supabase } from "./lib/supabaseClient";
import type { ApiKey } from "./types/common";

export const ApiKeyList = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No API keys found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md">
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="col-span-2 font-medium text-gray-700">Description</div>
        <div className="col-span-2 font-medium text-gray-700">API Key</div>
        <div className="font-medium text-gray-700">Created</div>
        <div className="font-medium text-gray-700">Actions</div>
      </div>
      {apiKeys.map(apiKey => (
        <ApiKeyItem key={apiKey.id} apiKey={apiKey} />
      ))}
    </div>
  );
};