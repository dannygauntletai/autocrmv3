import React from "react";
import { Code, Webhook, Activity } from "lucide-react";
export const IntegrationOverview = () => {
  const features = [{
    icon: <Code className="h-6 w-6" />,
    title: "API Access",
    description: "Integrate with our RESTful API using secure API keys."
  }, {
    icon: <Webhook className="h-6 w-6" />,
    title: "Webhooks",
    description: "Get real-time updates for events in your AutoCRM instance."
  }, {
    icon: <Activity className="h-6 w-6" />,
    title: "Usage Monitoring",
    description: "Track your API usage and webhook deliveries."
  }];
  return <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Integration Overview
      </h3>
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature, index) => <div key={index} className="space-y-3">
            <div className="text-blue-600">{feature.icon}</div>
            <h4 className="font-medium text-gray-900">{feature.title}</h4>
            <p className="text-sm text-gray-500">{feature.description}</p>
          </div>)}
      </div>
    </div>;
};