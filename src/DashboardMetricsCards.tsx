import { Clock, CheckCircle, AlertCircle, Users } from "lucide-react";
import { useAgentMetrics } from "./hooks/useAgentMetrics";

export const DashboardMetricsCards = () => {
  const { metrics, loading, error } = useAgentMetrics();

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error loading metrics: {error}
      </div>
    );
  }

  const metricsData = [
    {
      icon: <Clock className="h-6 w-6 text-blue-600" />,
      label: "Avg. Response Time",
      value: metrics?.avgResponseTime || '0m'
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      label: "Resolved Tickets",
      value: metrics?.resolvedTickets.toString() || '0'
    },
    {
      icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
      label: "Open Tickets",
      value: metrics?.openTickets.toString() || '0'
    },
    {
      icon: <Users className="h-6 w-6 text-purple-600" />,
      label: "Customer Satisfaction",
      value: "94%"
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            {metric.icon}
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-semibold text-gray-900">
              {metric.value}
            </h3>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};