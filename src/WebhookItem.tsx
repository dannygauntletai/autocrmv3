import { Trash2, Power } from "lucide-react";
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { Webhook } from "./types/common";

interface Props {
  webhook: Webhook;
}

export const WebhookItem = ({ webhook }: Props) => {
  const [isActive, setIsActive] = useState(webhook.is_active);

  const handleToggle = async () => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: !isActive })
        .eq('id', webhook.id);

      if (error) throw error;
      setIsActive(!isActive);
    } catch (error) {
      console.error('Error toggling webhook:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhook.id);

      if (error) throw error;
      // Trigger a refresh of the list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  return (
    <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 items-center">
      <div className="col-span-2">
        <div className="text-gray-900 truncate">{webhook.url}</div>
        <div className="text-sm text-gray-500">
          Created: {new Date(webhook.created_at).toLocaleDateString()}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {webhook.event_types.map((event, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            {event}
          </span>
        ))}
      </div>
      <div className="text-gray-900">
        {webhook.secret ? "Secret configured" : "No secret"}
      </div>
      <div>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleToggle}
          className="p-1 text-gray-600 hover:text-blue-600"
          title={isActive ? "Deactivate" : "Activate"}
        >
          <Power className="h-4 w-4" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-gray-600 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};