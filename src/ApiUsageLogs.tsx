import React from "react";
import { ApiUsageTable } from "./ApiUsageTable";
import { ApiUsageFilters } from "./ApiUsageFilters";
export const ApiUsageLogs = () => {
  return <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">API Usage</h3>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your API usage and webhook deliveries.
        </p>
      </div>
      <ApiUsageFilters />
      <ApiUsageTable />
    </div>;
};