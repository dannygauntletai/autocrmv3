import React, { useState } from "react";
import { Plus } from "lucide-react";
import { AgentItem } from "./AgentItem";
import { AssignSkillsModal } from "./AssignSkillsModal";
export const AgentsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const agents = [{
    id: "1",
    name: "John Doe",
    role: "Support Agent",
    skills: ["Technical Support", "Customer Service"],
    status: "Online",
    activeTickets: 5
  }, {
    id: "2",
    name: "Jane Smith",
    role: "Senior Agent",
    skills: ["Product Knowledge", "Technical Writing"],
    status: "Away",
    activeTickets: 3
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
        {agents.map(agent => <AgentItem key={agent.id} agent={agent} onAssignSkills={() => {
        setSelectedAgent(agent.id);
        setIsModalOpen(true);
      }} />)}
      </div>
      {isModalOpen && <AssignSkillsModal agentId={selectedAgent} onClose={() => {
      setIsModalOpen(false);
      setSelectedAgent(null);
    }} />}
    </div>;
};