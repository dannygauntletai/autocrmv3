import { MessageSquare, Clock, CheckCircle } from "lucide-react";
import { useRecentActivity } from "./hooks/useRecentActivity";

export const RecentActivityList = () => {
  const { activities, loading, error } = useRecentActivity();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="animate-pulse flex items-center gap-4">
                <div className="h-5 w-5 bg-gray-200 rounded" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="mt-2 h-4 w-48 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-red-600">Error loading activities: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map(activity => (
          <div key={activity.id} className="p-4">
            <div className="flex items-center gap-4">
              {activity.type === "reply" ? (
                <MessageSquare className="h-5 w-5 text-blue-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.ticket}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {activity.time}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};