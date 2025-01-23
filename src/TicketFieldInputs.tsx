import React from "react";
export const TicketFieldInputs = () => {
  return <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter ticket title" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={4} placeholder="Enter ticket description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option>New</option>
            <option>In Progress</option>
            <option>Pending</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>
    </div>;
};