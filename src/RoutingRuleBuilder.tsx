import React from "react";
import { RuleCriteriaForm } from "./RuleCriteriaForm";
import { RuleActionForm } from "./RuleActionForm";
interface Props {
  ruleId: string | null;
  onClose: () => void;
}
export const RoutingRuleBuilder = ({
  ruleId,
  onClose
}: Props) => {
  return <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rule Name
        </label>
        <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Technical Support Assignment" />
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Conditions</h4>
        <RuleCriteriaForm />
      </div>
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Actions</h4>
        <RuleActionForm />
      </div>
      <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {ruleId ? "Update Rule" : "Create Rule"}
        </button>
      </div>
    </form>;
};