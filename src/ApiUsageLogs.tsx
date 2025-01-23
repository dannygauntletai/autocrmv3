import { useState } from "react";
import { ApiUsageTable } from "./ApiUsageTable";
import { ApiUsageFilters } from "./ApiUsageFilters";

interface Filters {
  endpoint?: string;
  apiKeyId?: string;
  status?: string;
  date?: string;
}

export const ApiUsageLogs = () => {
  const [filters, setFilters] = useState<Filters>({});

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  return <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">API Usage</h3>
        <p className="text-sm text-gray-500 mt-1">
          Monitor your API usage and webhook deliveries.
        </p>
      </div>
      <ApiUsageFilters onFilterChange={handleFilterChange} />
      <ApiUsageTable filters={filters} />
    </div>;
};