import React from "react";
export const PriorityWeights = () => {
  return <div>
      <h4 className="text-sm font-medium text-gray-900 mb-4">
        Priority Weights
      </h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            High Priority Weight
          </label>
          <input type="number" defaultValue={3} min={1} max={5} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Medium Priority Weight
          </label>
          <input type="number" defaultValue={2} min={1} max={5} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Low Priority Weight
          </label>
          <input type="number" defaultValue={1} min={1} max={5} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>
    </div>;
};