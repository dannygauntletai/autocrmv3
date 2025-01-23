import React, { useState } from "react";
import { Plus } from "lucide-react";
import { RoutingRuleItem } from "./RoutingRuleItem";
import { NewRoutingRuleModal } from "./NewRoutingRuleModal";
export const RoutingRuleList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const rules = [{
    id: "1",
    name: "Technical Issues",
    criteria: "Subject contains 'error' OR 'bug'",
    action: "Assign to Technical Support team",
    priority: "High",
    active: true
  }, {
    id: "2",
    name: "Billing Issues",
    criteria: "Category equals 'Billing'",
    action: "Assign to Billing Support team",
    priority: "Medium",
    active: true
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Routing Rules</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure automatic ticket assignment rules
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          New Rule
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {rules.map(rule => <RoutingRuleItem key={rule.id} rule={rule} onEdit={() => {
        setEditingRule(rule.id);
        setIsModalOpen(true);
      }} />)}
      </div>
      {isModalOpen && <NewRoutingRuleModal ruleId={editingRule} onClose={() => {
      setIsModalOpen(false);
      setEditingRule(null);
    }} />}
    </div>;
};