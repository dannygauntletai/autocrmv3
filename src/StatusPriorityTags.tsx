import { Tag } from "lucide-react";
export const StatusPriorityTags = () => {
  return <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Status
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option>Open</option>
          <option>Pending</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Priority
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Tag className="h-3 w-3 mr-1" />
            bug
          </button>
          <button className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Tag className="h-3 w-3 mr-1" />
            dashboard
          </button>
        </div>
      </div>
    </div>;
};