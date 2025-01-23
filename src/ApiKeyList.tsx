import React from "react";
import { ApiKeyItem } from "./ApiKeyItem";
export const ApiKeyList = () => {
  // Example API keys - in real app, this would come from your backend
  const apiKeys = [{
    id: 1,
    name: "Production API Key",
    key: "pk_live_**********************1234",
    created: "2023-07-01",
    lastUsed: "2023-07-20",
    scopes: ["read", "write"]
  }, {
    id: 2,
    name: "Development API Key",
    key: "pk_test_**********************5678",
    created: "2023-07-15",
    lastUsed: "2023-07-19",
    scopes: ["read"]
  }];
  return <div className="border border-gray-200 rounded-md">
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="col-span-2 font-medium text-gray-700">Name</div>
        <div className="col-span-2 font-medium text-gray-700">API Key</div>
        <div className="font-medium text-gray-700">Last Used</div>
        <div className="font-medium text-gray-700">Actions</div>
      </div>
      {apiKeys.map(apiKey => <ApiKeyItem key={apiKey.id} apiKey={apiKey} />)}
    </div>;
};