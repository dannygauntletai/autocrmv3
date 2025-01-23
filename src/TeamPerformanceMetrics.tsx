import React from "react";
import { Clock, CheckCircle, ThumbsUp, Users } from "lucide-react";
export const TeamPerformanceMetrics = () => {
  const metrics = [{
    icon: <Clock className="h-6 w-6 text-blue-600" />,
    label: "Avg. Response Time",
    value: "1h 45m",
    change: "-12%",
    trend: "positive"
  }, {
    icon: <CheckCircle className="h-6 w-6 text-green-600" />,
    label: "Resolution Rate",
    value: "94%",
    change: "+3%",
    trend: "positive"
  }, {
    icon: <ThumbsUp className="h-6 w-6 text-yellow-600" />,
    label: "Customer Satisfaction",
    value: "4.8/5",
    change: "+0.2",
    trend: "positive"
  }, {
    icon: <Users className="h-6 w-6 text-purple-600" />,
    label: "Active Agents",
    value: "12",
    change: "+2",
    trend: "positive"
  }];
  return <div className="grid grid-cols-4 gap-6">
      {metrics.map((metric, index) => <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            {metric.icon}
            <span className={`text-sm font-medium ${metric.trend === "positive" ? "text-green-600" : metric.trend === "negative" ? "text-red-600" : "text-gray-600"}`}>
              {metric.change}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold text-gray-900">
              {metric.value}
            </h3>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        </div>)}
    </div>;
};