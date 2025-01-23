import React from "react";
import { Star, Edit2, Trash2, Circle } from "lucide-react";
interface Agent {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: string;
  activeTickets: number;
}
interface Props {
  agent: Agent;
  onAssignSkills: () => void;
}
export const AgentItem = ({
  agent,
  onAssignSkills
}: Props) => {
  return <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-gray-900">{agent.name}</h4>
            <span className="flex items-center gap-1 text-sm">
              <Circle className={`h-2 w-2 ${agent.status === "Online" ? "text-green-500" : "text-yellow-500"}`} />
              {agent.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">{agent.role}</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {agent.activeTickets} active tickets
            </div>
            <div className="flex flex-wrap gap-1">
              {agent.skills.map(skill => <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {skill}
                </span>)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onAssignSkills} className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
            Assign Skills
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-md">
            <Edit2 className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-600 hover:text-red-600 rounded-md">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>;
};