import React from "react";
import { Search } from "lucide-react";
export const AuditLogFilters = () => {
  return <div className="mb-6 flex gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input type="text" placeholder="Search audit logs..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
      </div>
      <input type="date" className="px-3 py-2 border border-gray-300 rounded-md" />
    </div>;
};