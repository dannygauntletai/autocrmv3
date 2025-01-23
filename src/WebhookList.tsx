import { useEffect, useState } from "react";
import { WebhookItem } from "./WebhookItem";
import { supabase } from "./lib/supabaseClient";
import type { Webhook } from "./types/common";

export const WebhookList = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebhooks = async () => {
      try {
        const { data, error } = await supabase
          .from('webhooks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWebhooks(data || []);
      } catch (error) {
        console.error('Error fetching webhooks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebhooks();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No webhooks found. Add one to get started.
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-md">
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="col-span-2 font-medium text-gray-700">Endpoint URL</div>
        <div className="font-medium text-gray-700">Events</div>
        <div className="font-medium text-gray-700">Created</div>
        <div className="font-medium text-gray-700">Status</div>
        <div className="font-medium text-gray-700">Actions</div>
      </div>
      {webhooks.map(webhook => (
        <WebhookItem key={webhook.id} webhook={webhook} />
      ))}
    </div>
  );
};