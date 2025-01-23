import React from "react";
import { WebhookItem } from "./WebhookItem";
export const WebhookList = () => {
  // Example webhooks - in real app, this would come from your backend
  const webhooks = [{
    id: 1,
    url: "https://api.example.com/webhooks/crm",
    events: ["ticket.created", "ticket.updated"],
    active: true,
    lastDelivery: "2023-07-20 15:30:00",
    successRate: "98%"
  }, {
    id: 2,
    url: "https://webhook.site/123456789",
    events: ["ticket.deleted"],
    active: false,
    lastDelivery: "2023-07-19 12:15:00",
    successRate: "100%"
  }];
  return <div className="border border-gray-200 rounded-md">
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="col-span-2 font-medium text-gray-700">Endpoint URL</div>
        <div className="font-medium text-gray-700">Events</div>
        <div className="font-medium text-gray-700">Success Rate</div>
        <div className="font-medium text-gray-700">Status</div>
        <div className="font-medium text-gray-700">Actions</div>
      </div>
      {webhooks.map(webhook => <WebhookItem key={webhook.id} webhook={webhook} />)}
    </div>;
};