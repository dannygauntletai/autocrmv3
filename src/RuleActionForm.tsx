import React from "react";
export const RuleActionForm = () => {
  return <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign To Team
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option>Technical Support</option>
          <option>Billing Support</option>
          <option>Customer Success</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Set Priority
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>
      <div className="flex items-center">
        <input type="checkbox" id="autoReply" className="mr-2" />
        <label htmlFor="autoReply" className="text-sm text-gray-700">
          Send auto-reply message
        </label>
      </div>
    </div>;
};