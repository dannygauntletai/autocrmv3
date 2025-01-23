import { X } from "lucide-react";
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import type { WebhookEventType } from "./types/common";

interface Props {
  onClose: () => void;
}

export const CreateWebhookModal = ({ onClose }: Props) => {
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [eventTypes, setEventTypes] = useState<Record<WebhookEventType, boolean>>({
    TICKET_CREATED: false,
    TICKET_UPDATED: false,
    TICKET_DELETED: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEvents = Object.entries(eventTypes)
      .filter(([_, selected]) => selected)
      .map(([event]) => event);

    if (selectedEvents.length === 0) {
      alert("Please select at least one event type");
      return;
    }

    try {
      const { error } = await supabase
        .from('webhooks')
        .insert({
          url,
          secret: secret || null,
          event_types: selectedEvents,
          is_active: true,
        });

      if (error) throw error;
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error creating webhook:', error);
    }
  };

  const handleEventChange = (event: WebhookEventType) => {
    setEventTypes(prev => ({
      ...prev,
      [event]: !prev[event],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Webhook</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="https://your-domain.com/webhook"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret (Optional)
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Webhook secret for payload verification"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Events
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="TICKET_CREATED"
                  checked={eventTypes.TICKET_CREATED}
                  onChange={() => handleEventChange('TICKET_CREATED')}
                  className="mr-2"
                />
                <label htmlFor="TICKET_CREATED" className="text-sm text-gray-700">
                  Ticket Created
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="TICKET_UPDATED"
                  checked={eventTypes.TICKET_UPDATED}
                  onChange={() => handleEventChange('TICKET_UPDATED')}
                  className="mr-2"
                />
                <label htmlFor="TICKET_UPDATED" className="text-sm text-gray-700">
                  Ticket Updated
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="TICKET_DELETED"
                  checked={eventTypes.TICKET_DELETED}
                  onChange={() => handleEventChange('TICKET_DELETED')}
                  className="mr-2"
                />
                <label htmlFor="TICKET_DELETED" className="text-sm text-gray-700">
                  Ticket Deleted
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Webhook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};