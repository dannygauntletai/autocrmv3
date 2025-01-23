import { DashboardMetricsCards } from "./DashboardMetricsCards";
import { RecentActivityList } from "./RecentActivityList";
export const AgentDashboard = () => {
  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Agent Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your performance and recent activity
          </p>
        </div>
      </div>
      <DashboardMetricsCards />
      <RecentActivityList />
    </div>;
};