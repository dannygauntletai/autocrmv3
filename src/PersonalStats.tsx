import React from "react";
import { StatsChart } from "./StatsChart";
import { StatsSummary } from "./StatsSummary";
export const PersonalStats = () => {
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Performance</h3>
      </div>
      <div className="p-4">
        <StatsSummary />
        <div className="mt-6">
          <StatsChart />
        </div>
      </div>
    </div>;
};