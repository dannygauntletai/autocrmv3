import { Clock, CheckCircle, AlertCircle, Users } from "lucide-react";
export const DashboardMetricsCards = () => {
  const metrics = [{
    icon: <Clock className="h-6 w-6 text-blue-600" />,
    label: "Avg. Response Time",
    value: "1h 23m",
    change: "-12%",
    trend: "positive"
  }, {
    icon: <CheckCircle className="h-6 w-6 text-green-600" />,
    label: "Resolved Tickets",
    value: "47",
    change: "+8%",
    trend: "positive"
  }, {
    icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
    label: "Open Tickets",
    value: "13",
    change: "+2",
    trend: "neutral"
  }, {
    icon: <Users className="h-6 w-6 text-purple-600" />,
    label: "Customer Satisfaction",
    value: "94%",
    change: "+3%",
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