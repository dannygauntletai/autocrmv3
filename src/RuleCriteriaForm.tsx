import React from "react";
import { Plus, Trash2 } from "lucide-react";
export const RuleCriteriaForm = () => {
  return <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <select className="px-3 py-2 border border-gray-300 rounded-md">
          <option>Subject</option>
          <option>Category</option>
          <option>Priority</option>
          <option>Customer Type</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-md">
          <option>contains</option>
          <option>equals</option>
          <option>starts with</option>
          <option>ends with</option>
        </select>
        <div className="flex gap-2">
          <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Value" />
          <button type="button" className="p-2 text-gray-600 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <button type="button" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
        <Plus className="h-4 w-4 mr-1" />
        Add Condition
      </button>
    </div>;
};