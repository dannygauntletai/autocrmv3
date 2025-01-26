import { useEffect, useState } from 'react';
import { DashboardMetricsCards } from "./DashboardMetricsCards";
import { RecentActivityList } from "./RecentActivityList";
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabaseClient';

export const AgentDashboard = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('Guest');
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null);

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  useEffect(() => {
    const fetchSatisfactionScore = async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('rating')
        .eq('status', 'completed')
        .not('rating', 'is', null);

      if (error) {
        console.error('Error fetching satisfaction score:', error);
        return;
      }

      if (data && data.length > 0) {
        const average = data.reduce((sum, item) => sum + item.rating, 0) / data.length;
        setSatisfactionScore(Number(average.toFixed(1)));
      }
    };

    fetchSatisfactionScore();
  }, []);

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
        {satisfactionScore !== null && (
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Customer Satisfaction</p>
            <p className="text-2xl font-semibold text-blue-600">
              {satisfactionScore}/5
            </p>
          </div>
        )}
      </div>
      <DashboardMetricsCards />
      <RecentActivityList />
    </div>;
};