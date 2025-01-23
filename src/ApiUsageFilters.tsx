import React from "react";
import { Search } from "lucide-react";
export const ApiUsageFilters = () => {
  return <div className="mb-6 flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input type="text" placeholder="Search endpoints..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
      </div>
      <select className="px-3 py-2 border border-gray-300 rounded-md">
        <option>All Methods</option>
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>DELETE</option>
      </select>
      <select className="px-3 py-2 border border-gray-300 rounded-md">
        <option>All Status</option>
        <option>Success (2xx)</option>
        <option>Error (4xx)</option>
        <option>Server Error (5xx)</option>
      </select>
      <input type="date" className="px-3 py-2 border border-gray-300 rounded-md" />
    </div>;
};