import { MessageSquare, Clock, CheckCircle } from "lucide-react";
export const RecentActivityList = () => {
  const activities = [{
    id: 1,
    type: "reply",
    ticket: "Unable to access dashboard",
    time: "23 minutes ago",
    description: "Replied to customer inquiry"
  }, {
    id: 2,
    type: "resolved",
    ticket: "Password reset request",
    time: "1 hour ago",
    description: "Marked ticket as resolved"
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map(activity => <div key={activity.id} className="p-4">
            <div className="flex items-center gap-4">
              {activity.type === "reply" ? <MessageSquare className="h-5 w-5 text-blue-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
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
          </div>)}
      </div>
    </div>;
};