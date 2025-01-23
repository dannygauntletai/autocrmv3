import React from "react";
import { Users, Clock, CheckCircle } from "lucide-react";
export const TeamOverview = () => {
  const metrics = [{
    icon: <Users className="h-6 w-6 text-blue-600" />,
    label: "Active Agents",
    value: "8",
    subtext: "2 currently online"
  }, {
    icon: <Clock className="h-6 w-6 text-green-600" />,
    label: "Average Response Time",
    value: "45m",
    subtext: "Last 24 hours"
  }, {
    icon: <CheckCircle className="h-6 w-6 text-purple-600" />,
    label: "Resolution Rate",
    value: "92%",
    subtext: "This week"
  }];
  return <div className="grid grid-cols-3 gap-6">
      {metrics.map((metric, index) => <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">{metric.icon}</div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold text-gray-900">
              {metric.value}
            </h3>
            <p className="text-sm text-gray-500">{metric.label}</p>
            <p className="text-xs text-gray-400 mt-1">{metric.subtext}</p>
          </div>
        </div>)}
    </div>;
};