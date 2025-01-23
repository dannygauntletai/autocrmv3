import { useState } from "react";
import { Plus } from "lucide-react";
import { SkillList } from "./SkillList";
import { AddSkillForm } from "./AddSkillForm";
export const SkillsetsPanel = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Agent Skills</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage agent competencies and expertise levels
          </p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Add Skill
        </button>
      </div>
      <SkillList />
      {isFormOpen && <AddSkillForm onClose={() => setIsFormOpen(false)} />}
    </div>;
};