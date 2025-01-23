import React from "react";
import { Edit2, Trash2, Power } from "lucide-react";
interface Webhook {
  id: number;
  url: string;
  events: string[];
  active: boolean;
  lastDelivery: string;
  successRate: string;
}
interface Props {
  webhook: Webhook;
}
export const WebhookItem = ({
  webhook
}: Props) => {
  return <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 items-center">
      <div className="col-span-2">
        <div className="text-gray-900 truncate">{webhook.url}</div>
        <div className="text-sm text-gray-500">
          Last delivery: {webhook.lastDelivery}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {webhook.events.map((event, index) => <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {event}
          </span>)}
      </div>
      <div className="text-gray-900">{webhook.successRate}</div>
      <div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${webhook.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
          {webhook.active ? "Active" : "Inactive"}
        </span>
      </div>
      <div className="flex gap-2">
        <button className="p-1 text-gray-600 hover:text-blue-600" title="Toggle">
          <Power className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-600 hover:text-blue-600" title="Edit">
          <Edit2 className="h-4 w-4" />
        </button>
        <button className="p-1 text-gray-600 hover:text-red-600" title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>;
};