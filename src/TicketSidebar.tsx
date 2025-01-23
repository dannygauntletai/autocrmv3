import React from "react";
import { Plus } from "lucide-react";
export const TicketSidebar = () => {
  return <div className="p-4 space-y-6">
      {/* Status and Priority */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option>Open</option>
            <option>Pending</option>
            <option>Resolved</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
      </div>
      {/* Internal Notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Internal Notes</h3>
          <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </button>
        </div>
        <div className="space-y-3">
          {/* Example Notes */}
          <div className="bg-yellow-50 p-3 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-gray-900">
                Jane Smith
              </div>
              <div className="text-xs text-gray-500">1 hour ago</div>
            </div>
            <p className="text-sm text-gray-700">
              Customer reported similar issue last month. Checking previous
              resolution.
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium text-gray-900">
                Mike Johnson
              </div>
              <div className="text-xs text-gray-500">30 mins ago</div>
            </div>
            <p className="text-sm text-gray-700">
              Escalated to engineering team for investigation.
            </p>
          </div>
        </div>
      </div>
    </div>;
};