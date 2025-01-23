import React, { useState } from "react";
import { Plus } from "lucide-react";
import { TeamAgentItem } from "./TeamAgentItem";
import { InviteAgentModal } from "./InviteAgentModal";
export const TeamAgentsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const agents = [{
    id: "1",
    name: "John Doe",
    role: "Senior Agent",
    avatar: "https://ui-avatars.com/api/?name=John+Doe",
    status: "online",
    activeTickets: 4,
    skills: ["Technical Support", "Product Knowledge"],
    metrics: {
      responseTime: "45m",
      resolution: "92%",
      satisfaction: "4.9/5"
    }
  }, {
    id: "2",
    name: "Jane Smith",
    role: "Agent",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith",
    status: "busy",
    activeTickets: 3,
    skills: ["Customer Service", "Technical Support"],
    metrics: {
      responseTime: "52m",
      resolution: "88%",
      satisfaction: "4.7/5"
    }
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Invite Agent
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {agents.map(agent => <TeamAgentItem key={agent.id} agent={agent} />)}
      </div>
      {isModalOpen && <InviteAgentModal onClose={() => setIsModalOpen(false)} />}
    </div>;
};