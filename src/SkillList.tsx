import React from "react";
import { Edit2, Trash2 } from "lucide-react";
export const SkillList = () => {
  const skills = [{
    id: "1",
    name: "Technical Troubleshooting",
    category: "Technical"
  }, {
    id: "2",
    name: "Customer Communication",
    category: "Soft Skills"
  }];
  return <div className="divide-y divide-gray-200">
      {skills.map(skill => <div key={skill.id} className="p-6 flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900">{skill.name}</h4>
            <div className="mt-1 text-sm text-gray-500">{skill.category}</div>
          </div>
          <div className="flex gap-2">
            <button className="p-1 text-gray-600 hover:text-blue-600">
              <Edit2 className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-600 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>)}
    </div>;
};