import { TrendingUp, Clock, ThumbsUp } from "lucide-react";
export const StatsSummary = () => {
  const stats = [{
    icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    label: "Resolution Rate",
    value: "94%"
  }, {
    icon: <Clock className="h-4 w-4 text-blue-500" />,
    label: "Avg. Handle Time",
    value: "12m"
  }, {
    icon: <ThumbsUp className="h-4 w-4 text-yellow-500" />,
    label: "Satisfaction",
    value: "4.8/5"
  }];
  return <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, index) => <div key={index} className="text-center">
          <div className="flex justify-center mb-1">{stat.icon}</div>
          <div className="text-lg font-semibold text-gray-900">
            {stat.value}
          </div>
          <div className="text-xs text-gray-500">{stat.label}</div>
        </div>)}
    </div>;
};