import React from "react";
export const StatsChart = () => {
  // This is a simplified version. In a real app, you might want to use a charting library
  const data = [{
    day: "Mon",
    tickets: 12
  }, {
    day: "Tue",
    tickets: 8
  }, {
    day: "Wed",
    tickets: 15
  }, {
    day: "Thu",
    tickets: 10
  }, {
    day: "Fri",
    tickets: 7
  }];
  const maxTickets = Math.max(...data.map(d => d.tickets));
  return <div>
      <h4 className="text-sm font-medium text-gray-700 mb-4">
        Tickets Resolved
      </h4>
      <div className="space-y-2">
        {data.map(item => <div key={item.day} className="flex items-center gap-2">
            <div className="w-8 text-sm text-gray-600">{item.day}</div>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{
            width: `${item.tickets / maxTickets * 100}%`
          }} />
            </div>
            <div className="w-8 text-sm text-gray-600">{item.tickets}</div>
          </div>)}
      </div>
    </div>;
};