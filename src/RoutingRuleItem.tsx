import React from "react";
import { Edit2, Trash2, Power } from "lucide-react";
interface Rule {
  id: string;
  name: string;
  criteria: string;
  action: string;
  priority: string;
  active: boolean;
}
interface Props {
  rule: Rule;
  onEdit: () => void;
}
export const RoutingRuleItem = ({
  rule,
  onEdit
}: Props) => {
  return <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${rule.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
              {rule.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">If:</span> {rule.criteria}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Then:</span> {rule.action}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Priority:</span> {rule.priority}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-md" title={rule.active ? "Deactivate" : "Activate"}>
            <Power className="h-4 w-4" />
          </button>
          <button onClick={onEdit} className="p-2 text-gray-600 hover:text-blue-600 rounded-md">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-red-600 rounded-md">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>;
};