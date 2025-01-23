import React from "react";
export const BreakTimeSettings = () => {
  return <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">Break Times</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Lunch Break Duration
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option>30 minutes</option>
            <option>45 minutes</option>
            <option>60 minutes</option>
          </select>
        </div>
        <div>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span className="text-sm text-gray-700">
              Allow flexible break times
            </span>
          </label>
        </div>
      </div>
    </div>;
};