import { useState } from "react";
import { Plus } from "lucide-react";
import { TeamItem } from "./TeamItem";
import { AssignEmployeeModal } from "./AssignEmployeeModal";
export const TeamsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const teams = [{
    id: "1",
    name: "Technical Support",
    description: "Handle technical product issues",
    memberCount: 8,
    tags: ["technical", "product"]
  }, {
    id: "2",
    name: "Billing Support",
    description: "Handle billing and subscription inquiries",
    memberCount: 5,
    tags: ["billing", "accounts"]
  }];
  return <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Teams</h3>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-5 w-5 mr-2" />
          Create Team
        </button>
      </div>
      <div className="divide-y divide-gray-200">
        {teams.map(team => <TeamItem key={team.id} team={team} onAssignEmployee={() => {
        setIsModalOpen(true);
      }} />)}
      </div>
      {isModalOpen && <AssignEmployeeModal onClose={() => {
      setIsModalOpen(false);
    }} />}
    </div>;
};