import React from "react";
import { Users, Clock, CheckCircle } from "lucide-react";
export const TeamsOverview = () => {
  const metrics = [{
    icon: <Users className="h-6 w-6 text-blue-600" />,
    label: "Total Teams",
    value: "5"
  }, {
    icon: <Clock className="h-6 w-6 text-green-600" />,
    label: "Avg. Response Time",
    value: "1h 15m"
  }, {
    icon: <CheckCircle className="h-6 w-6 text-purple-600" />,
    label: "Resolution Rate",
    value: "94%"
  }];
  return <div className="grid grid-cols-3 gap-6">
      {metrics.map((metric, index) => <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">{metric.icon}</div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold text-gray-900">
              {metric.value}
            </h3>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        </div>)}
    </div>;
};