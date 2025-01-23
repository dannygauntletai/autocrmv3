import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
export const ApiUsageTable = () => {
  // Example API calls - in real app, this would come from your backend
  const apiCalls = [{
    id: 1,
    endpoint: "/api/v1/tickets",
    method: "GET",
    timestamp: "2023-07-20 16:45:30",
    status: 200,
    duration: "123ms"
  }, {
    id: 2,
    endpoint: "/api/v1/tickets/create",
    method: "POST",
    timestamp: "2023-07-20 16:44:15",
    status: 400,
    duration: "89ms"
  }];
  return <div className="border border-gray-200 rounded-md">
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="font-medium text-gray-700">Timestamp</div>
        <div className="col-span-2 font-medium text-gray-700">Endpoint</div>
        <div className="font-medium text-gray-700">Method</div>
        <div className="font-medium text-gray-700">Status</div>
        <div className="font-medium text-gray-700">Duration</div>
      </div>
      {apiCalls.map(call => <div key={call.id} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200">
          <div className="text-sm text-gray-600">{call.timestamp}</div>
          <div className="col-span-2 font-mono text-sm text-gray-900">
            {call.endpoint}
          </div>
          <div className="text-sm text-gray-600">{call.method}</div>
          <div className="flex items-center gap-1">
            {call.status < 400 ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            <span className="text-sm text-gray-900">{call.status}</span>
          </div>
          <div className="text-sm text-gray-600">{call.duration}</div>
        </div>)}
    </div>;
};