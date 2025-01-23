import React, { useState } from "react";
import { Plus } from "lucide-react";
import { WebhookList } from "./WebhookList";
import { CreateWebhookModal } from "./CreateWebhookModal";
export const WebhookConfiguration = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Webhooks</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure webhook endpoints to receive real-time updates.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Add Webhook
        </button>
      </div>
      <WebhookList />
      {isModalOpen && <CreateWebhookModal onClose={() => setIsModalOpen(false)} />}
    </div>;
};