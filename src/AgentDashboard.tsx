import { useEffect, useState } from 'react';
import { DashboardMetricsCards } from "./DashboardMetricsCards";
import { RecentActivityList } from "./RecentActivityList";
import { useAuth } from './hooks/useAuth';

export const AgentDashboard = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('Guest');

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  return <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Hi, {displayName}
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