import React from "react";
import { Search, Filter } from "lucide-react";
export const QueueFilterBar = () => {
  return <div className="flex gap-4 items-center">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input type="text" placeholder="Search tickets..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
      </div>
      <select className="px-3 py-2 border border-gray-300 rounded-md">
        <option>All Status</option>
        <option>Open</option>
        <option>Pending</option>
        <option>On Hold</option>
        <option>Resolved</option>
      </select>
      <select className="px-3 py-2 border border-gray-300 rounded-md">
        <option>All Priority</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
      <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
        <Filter className="h-5 w-5 mr-2" />
        More Filters
      </button>
    </div>;
};