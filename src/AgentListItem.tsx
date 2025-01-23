import React from "react";
import { Award, Clock, ThumbsUp, Edit2, Trash2 } from "lucide-react";
interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  skills: string[];
  activeTickets: number;
  performance: {
    responseTime: string;
    satisfaction: string;
  };
}
interface Props {
  agent: Agent;
}
export const AgentListItem = ({
  agent
}: Props) => {
  return <div className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-medium text-gray-900">{agent.name}</h4>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${agent.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
              {agent.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{agent.email}</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {agent.performance.responseTime} avg. response
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {agent.performance.satisfaction} satisfaction
            </div>
            <div className="flex items-center text-sm text-gray-600">
              {agent.activeTickets} active tickets
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {agent.skills.map(skill => <span key={skill} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {skill}
              </span>)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
            <Award className="h-4 w-4 mr-1 inline-block" />
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